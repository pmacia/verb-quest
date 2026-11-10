import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { request } from 'node:https';
import { createHttpsServer } from './serve-https.mjs';
let directory, server, ca, port;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'verbquest-https-test-'));
  const root = join(directory, 'dist');
  await mkdir(join(root, 'assets'), { recursive: true });
  await writeFile(join(root, 'index.html'), '<h1>VerbQuest</h1>');
  await writeFile(join(root, 'sw.js'), 'self.addEventListener("fetch", () => {});');
  await writeFile(join(root, 'manifest.webmanifest'), '{}');
  await writeFile(join(root, 'assets', 'app-abc123.js'), 'export const ready=true;');
  await writeFile(join(directory, 'secret.txt'), 'PRIVATE');
  await writeFile(join(root, '.env'), 'PRIVATE');
  await symlink(join(directory, 'secret.txt'), join(root, 'leak.txt'));
  await symlink(join(root, '.env'), join(root, 'visible.txt'));
  const key = join(directory, 'key.pem'),
    cert = join(directory, 'cert.pem');
  const config = join(directory, 'test.cnf');
  await writeFile(
    config,
    '[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n[dn]\nCN=localhost\n[ext]\nsubjectAltName=DNS:localhost,IP:127.0.0.1\nbasicConstraints=CA:TRUE\n',
  );
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-days',
      '1',
      '-config',
      config,
      '-keyout',
      key,
      '-out',
      cert,
    ],
    { stdio: 'ignore' },
  );
  ca = await readFile(cert);
  server = await createHttpsServer({ root, cert, key });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (directory) await rm(directory, { recursive: true, force: true });
});
function fetchPath(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, method, ca }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}
test('serves real HTTPS with trusted test certificate, SPA routes and correct MIME', async () => {
  const home = await fetchPath('/');
  assert.equal(home.status, 200);
  assert.match(home.body, /VerbQuest/);
  assert.match(home.headers['content-type'], /text\/html/);
  const deep = await fetchPath('/verbs/become?mode=detail');
  assert.equal(deep.body, home.body);
  assert.equal(deep.status, 200);
  const asset = await fetchPath('/assets/app-abc123.js');
  assert.equal(asset.status, 200);
  assert.match(asset.headers['content-type'], /javascript/);
  assert.match(asset.headers['cache-control'], /immutable/);
});
test('refreshes shell, worker and manifest while HEAD keeps headers without a body', async () => {
  for (const path of ['/', '/sw.js', '/manifest.webmanifest'])
    assert.match((await fetchPath(path)).headers['cache-control'], /no-cache/);
  const head = await fetchPath('/assets/app-abc123.js', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.ok(Number(head.headers['content-length']) > 0);
  assert.equal((await fetchPath('/sw.js')).headers['service-worker-allowed'], '/');
});
test('does not turn missing assets into HTML or serve secret files outside the build', async () => {
  for (const path of [
    '/assets/missing.js',
    '/icons/missing',
    '/.env',
    '/.certs/key.pem',
    '/leak.txt',
    '/visible.txt',
    '/%2e%2e%2fsecret.txt',
  ]) {
    const res = await fetchPath(path);
    assert.equal(res.status, 404, path);
    assert.doesNotMatch(res.body, /PRIVATE|<h1>/);
  }
  assert.equal((await fetchPath('/%ZZ')).status, 400);
});
test('rejects writes and fails clearly for an unbuilt directory or missing certificate', async () => {
  const res = await fetchPath('/', 'POST');
  assert.equal(res.status, 405);
  assert.equal(res.headers.allow, 'GET, HEAD');
  await assert.rejects(
    createHttpsServer({ root: directory, cert: 'none', key: 'none' }),
    /npm run build/,
  );
  await assert.rejects(
    createHttpsServer({ root: join(directory, 'dist'), cert: 'none', key: 'none' }),
    /certificado/i,
  );
});
