import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';

const project = resolve(import.meta.dirname, '..');
const fixture = await mkdtemp(join(tmpdir(), 'verbquest-hmr-'));
let server: Awaited<ReturnType<typeof createServer>> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  for (const file of ['src', 'index.html', 'vite.config.ts', 'package.json'])
    await cp(join(project, file), join(fixture, file), { recursive: true });
  const baseline = process.argv
    .find((arg) => arg.startsWith('--baseline='))
    ?.slice('--baseline='.length);
  if (baseline) {
    if (!/^[0-9a-f]{7,40}$/i.test(baseline)) throw Error('Baseline must be a commit SHA');
    await rm(join(fixture, 'src'), { recursive: true });
    const archive = execFileSync('git', ['archive', baseline, 'src'], {
      cwd: project,
      maxBuffer: 20 * 1024 * 1024,
    });
    execFileSync('tar', ['-xf', '-', '-C', fixture], { input: archive });
  }
  await symlink(join(project, 'node_modules'), join(fixture, 'node_modules'));
  await symlink(join(project, 'public'), join(fixture, 'public'));
  const provider = join(fixture, 'src/app/AppProviders.tsx');
  const contextFile = await readFile(join(fixture, 'src/app/app-context.ts'))
    .then(() => join(fixture, 'src/app/app-context.ts'))
    .catch(() => provider);
  const contextSource = await readFile(contextFile, 'utf8');
  const contextName = contextFile === provider ? 'Context' : 'AppContext';
  await writeFile(
    contextFile,
    contextSource + `\nexport const __hmrTestContext = ${contextName};\n`,
  );
  const contextUrl =
    '/src/app/' + (contextFile === provider ? 'AppProviders.tsx' : 'app-context.ts');
  server = await createServer({
    root: fixture,
    configFile: join(fixture, 'vite.config.ts'),
    cacheDir: join(fixture, '.vite-cache'),
    server: { host: '127.0.0.1', port: 0, open: false },
  });
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === 'string') throw Error('No test port');
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${address.port}/settings`);
  await page.getByRole('switch', { name: 'Modo IPA estricto' }).check();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.evaluate(async (url) => {
    const module = await import(url);
    (window as unknown as { __hmrContext: unknown }).__hmrContext = module.__hmrTestContext;
  }, contextUrl);
  await writeFile(
    contextFile,
    (await readFile(contextFile, 'utf8')) + '\n// HMR context replacement regression\n',
  );
  await expect
    .poll(async () =>
      page.evaluate(
        (url) =>
          performance.getEntriesByType('resource').some((entry) => {
            const address = new URL(entry.name);
            return address.pathname === url && address.searchParams.has('t');
          }),
        contextUrl,
      ),
    )
    .toBe(true);
  expect(
    await page.evaluate(async (url) => {
      const entry = performance
        .getEntriesByType('resource')
        .filter((entry) => {
          const address = new URL(entry.name);
          return address.pathname === url && address.searchParams.has('t');
        })
        .at(-1)!;
      return (
        (await import(entry.name)).__hmrTestContext ===
        (window as unknown as { __hmrContext: unknown }).__hmrContext
      );
    }, contextUrl),
    'HMR must retain the shared Context identity',
  ).toBe(true);
  const source = await readFile(provider, 'utf8');
  await writeFile(
    provider,
    source
      .replace('strictIpa: settings.strictIpa === true', 'strictIpa: Boolean(settings.strictIpa)')
      .replace('>{children}</', '><span id="hmr-proof">Hot version</span>{children}</'),
  );
  // Wait for the real Vite update, rather than checking the old render before HMR.
  await expect
    .poll(async () => {
      const text = await page.locator('body').innerText();
      return (
        text.includes('Aplicación no preparada') ||
        (await page.evaluate(() =>
          performance
            .getEntriesByType('resource')
            .some((entry) => /AppProviders.tsx\?t=/.test(entry.name)),
        ))
      );
    })
    .toBe(true);
  await expect(page.locator('#hmr-proof')).toHaveText('Hot version');
  await expect(page.getByRole('heading', { name: 'A tu manera', exact: false })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Modo IPA estricto' })).toBeChecked();
  expect(
    errors.filter((error) => /Aplicación no preparada|Unexpected Application Error/.test(error)),
  ).toEqual([]);
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Modo IPA estricto' })).toBeChecked();
  console.log('Development HMR preserves the provider and saved preferences.');
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
