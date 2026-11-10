import { createServer } from 'node:https';
import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, extname, sep, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { networkInterfaces } from 'node:os';
import { parseArgs } from 'node:util';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};
function inside(root, file) {
  const path = relative(root, file);
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
}
function respond(request, response, status, text, extra = {}) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  });
  response.end(request.method === 'HEAD' ? undefined : text);
}
export async function createHttpsServer({
  root = 'dist',
  cert = '.certs/verbquest.pem',
  key = '.certs/verbquest-key.pem',
} = {}) {
  let directory;
  try {
    directory = await realpath(resolve(root));
    const index = await realpath(resolve(directory, 'index.html'));
    if (!inside(directory, index) || !(await stat(index)).isFile()) throw Error('Invalid build');
  } catch {
    throw Error(
      'No se encuentra una compilación válida. Ejecuta npm run build o indica su ruta con --dir.',
    );
  }
  let credentials;
  try {
    credentials = { cert: await readFile(resolve(cert)), key: await readFile(resolve(key)) };
  } catch {
    throw Error(
      'No se puede leer el certificado o la clave. Consulta docs/home-https.md o indica --cert y --key.',
    );
  }
  return createServer({ ...credentials, minVersion: 'TLSv1.2' }, async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method))
      return respond(request, response, 405, 'Método no permitido.', { Allow: 'GET, HEAD' });
    let path;
    try {
      path = decodeURIComponent(new URL(request.url, 'https://verbquest.invalid').pathname);
      if (path.includes('\0') || path.includes('\\')) throw Error('Invalid path');
    } catch {
      return respond(request, response, 400, 'Ruta no válida.');
    }
    if (path.split('/').some((part) => part.startsWith('.')))
      return respond(request, response, 404, 'No encontrado.');
    let file = resolve(directory, path.replace(/^\/+/, '') || 'index.html');
    if (!inside(directory, file)) return respond(request, response, 404, 'No encontrado.');
    try {
      try {
        file = await realpath(file);
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
        const reserved = /^\/(assets|icons|brand)(\/|$)/.test(path);
        if (extname(path) || reserved) return respond(request, response, 404, 'No encontrado.');
        file = await realpath(resolve(directory, 'index.html'));
      }
      if (!inside(directory, file)) return respond(request, response, 404, 'No encontrado.');
      const name = relative(directory, file).split(sep).join('/');
      if (name.split('/').some((part) => part.startsWith('.')))
        return respond(request, response, 404, 'No encontrado.');
      const info = await stat(file);
      if (!info.isFile()) return respond(request, response, 404, 'No encontrado.');
      const immutable = name.startsWith('assets/') && /-[\w-]{6,}\.[\w]+$/.test(name);
      response.writeHead(200, {
        'Content-Type': types[extname(file).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        ...(name === 'sw.js' ? { 'Service-Worker-Allowed': '/' } : {}),
      });
      if (request.method === 'HEAD') return response.end();
      await pipeline(createReadStream(file), response);
    } catch {
      if (!response.headersSent)
        respond(request, response, 500, 'No se ha podido servir el archivo.');
      else response.destroy();
    }
  });
}
function addressUrl(host, port) {
  return `https://${host.includes(':') ? `[${host}]` : host}:${port}/`;
}
async function main() {
  const { values } = parseArgs({
    options: {
      host: { type: 'string', default: '0.0.0.0' },
      port: { type: 'string', default: '8443' },
      dir: { type: 'string', default: 'dist' },
      cert: { type: 'string', default: '.certs/verbquest.pem' },
      key: { type: 'string', default: '.certs/verbquest-key.pem' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(
      `Servidor HTTPS doméstico de VerbQuest (Node24)\n\nnpm run serve:https -- [--host 0.0.0.0] [--port 8443] [--dir dist]\n                         [--cert .certs/verbquest.pem] [--key .certs/verbquest-key.pem]\n\nEjecuta npm run build antes. El certificado debe cubrir la dirección que utilices\ny ser de confianza en cada dispositivo. Guía: docs/home-https.md`,
    );
    return;
  }
  const port = Number(values.port);
  if (!/^\d+$/.test(values.port) || !Number.isInteger(port) || port < 1 || port > 65535)
    throw Error('El puerto debe ser un número entre 1 y 65535.');
  const server = await createHttpsServer({ root: values.dir, cert: values.cert, key: values.key });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, values.host, resolve);
  });
  console.log(`\nVerbQuest · HTTPS doméstico\nArchivos: ${resolve(values.dir)}\n`);
  const addresses = new Set();
  if (['0.0.0.0', '::'].includes(values.host)) {
    addresses.add(addressUrl('localhost', port));
    for (const entries of Object.values(networkInterfaces()))
      for (const entry of entries ?? [])
        if (!entry.internal && entry.family === 'IPv4')
          addresses.add(addressUrl(entry.address, port));
  } else addresses.add(addressUrl(values.host, port));
  for (const address of addresses) console.log(`  ${address}`);
  console.log(
    '\nUsa una dirección incluida en el certificado y de confianza en el dispositivo.\nCtrl+C para detener.\n',
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`No se ha iniciado HTTPS: ${error.message}`);
    process.exitCode = 1;
  });
}
