import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test as base, expect, type Page } from '@playwright/test';
import type { Attempt, SkillProgress, StudySession, XpEntry } from '../src/shared/domain/types';

type Release = 'initial' | 'next' | 'without-activation';
type ReleaseServer = { origin: string; publish: (release: Release) => void };

const test = base.extend<{ releaseServer: ReleaseServer }>({
  releaseServer: async ({ baseURL }, use) => {
    if (!baseURL) throw Error('The Playwright preview needs a baseURL');
    const upstream = new URL(baseURL);
    const [originalHtml, originalWorker] = await Promise.all(
      ['/index.html', '/sw.js'].map(async (path) => {
        const response = await fetch(new URL(path, upstream));
        if (!response.ok) throw Error(`Cannot load ${path}: HTTP ${response.status}`);
        return response.text();
      }),
    );
    const nextHtml = originalHtml.replace(
      '</head>',
      '<meta name="pwa-e2e-release" content="next"></head>',
    );
    const revision = createHash('md5').update(nextHtml).digest('hex');
    const indexRevision = /(url:\s*['"]index\.html['"]\s*,\s*revision:\s*['"])[a-f0-9]+/;
    if (!indexRevision.test(originalWorker)) throw Error('Missing index.html precache revision');
    const nextWorker = originalWorker.replace(
      indexRevision,
      (_, prefix: string) => prefix + revision,
    );
    // Fault injection: keep a real waiting worker but suppress Workbox's activation message.
    const blockActivation = `self.addEventListener('message', event => {
      if (event.data?.type === 'SKIP_WAITING') event.stopImmediatePropagation();
    });\n`;

    const workers: Record<Release, string> = {
      initial: originalWorker,
      next: nextWorker,
      'without-activation': blockActivation + nextWorker,
    };

    let release: Release = 'initial';
    const server = createServer(async (request, response) => {
      try {
        const requested = new URL(request.url ?? '/', upstream);
        const path = new URL(upstream);
        path.pathname = requested.pathname;
        path.search = requested.search;
        if (path.pathname === '/sw.js') {
          response.writeHead(200, {
            'Content-Type': 'text/javascript',
            'Cache-Control': 'no-store',
          });
          response.end(workers[release]);
          return;
        }
        if (path.pathname === '/index.html' && release !== 'initial') {
          response.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
          });
          response.end(nextHtml);
          return;
        }
        const result = await fetch(path);
        response.writeHead(result.status, {
          'Content-Type': result.headers.get('Content-Type') ?? 'application/octet-stream',
        });
        response.end(Buffer.from(await result.arrayBuffer()));
      } catch {
        response.writeHead(502).end();
      }
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    try {
      await use({
        origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        publish: (version) => {
          release = version;
        },
      });
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  },
});

async function records(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('verbquest');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = db.transaction(['sessions', 'attempts', 'progress', 'xpLedger']);
    function all<T>(table: string) {
      return new Promise<T[]>((resolve, reject) => {
        const request = transaction.objectStore(table).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    try {
      const [sessions, attempts, progress, xp] = await Promise.all([
        all<StudySession>('sessions'),
        all<Attempt>('attempts'),
        all<SkillProgress>('progress'),
        all<XpEntry>('xpLedger'),
      ]);
      return { sessions, attempts, progress, xp };
    } finally {
      db.close();
    }
  });
}

async function startStudy(page: Page, origin: string, reloadWithController = false) {
  await page.goto(origin + '/games');
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state))
    .toBe('activated');
  if (reloadWithController) await page.reload();
  await page.getByLabel('Selección de verbos').selectOption('manual');
  for (const verb of ['buy', 'go']) {
    await page.getByRole('checkbox', { name: new RegExp(`^${verb} ·`) }).check();
  }
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Repaso de verbos', exact: true }) })
    .getByRole('button', { name: 'Jugar ahora' })
    .click();
  const {
    sessions: [session],
  } = await records(page);
  expect(session.queue.length).toBeGreaterThan(1);
  const answers =
    session.queue[0].verbId === 'buy' ? ['buy', 'bought', 'bought'] : ['go', 'went', 'gone'];
  for (const [i, label] of ['Infinitivo', 'Pasado', 'Participio'].entries()) {
    await page.getByRole('textbox', { name: label, exact: true }).fill(answers[i]);
  }
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  return records(page);
}

async function watchControllerChange(page: Page) {
  await page.evaluate(() => {
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => sessionStorage.setItem('pwa-e2e-controller-changed', 'yes'),
      { once: true },
    );
  });
}

async function waitForControllerChange(page: Page) {
  await page.waitForFunction(
    () => sessionStorage.getItem('pwa-e2e-controller-changed') === 'yes',
    null,
    { timeout: 5000 },
  );
}

async function confirmUpdate(page: Page, server: ReleaseServer, version: Release, otherTab?: Page) {
  server.publish(version);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  });
  await expect
    .poll(() =>
      page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.waiting?.state),
    )
    .toBe('installed');
  if (otherTab) {
    await expect(otherTab.getByRole('button', { name: 'Actualizar aplicación' })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Actualizar aplicación', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cerrar sesión y actualizar', exact: true })
    .click();
}

for (const reloadWithController of [false, true]) {
  const entry = reloadWithController ? 'already controlled' : 'first visit';
  test(`activates a waiting worker and reloads the committed study data (${entry})`, async ({
    page,
    releaseServer,
  }) => {
    const before = await startStudy(page, releaseServer.origin, reloadWithController);
    expect(before.attempts).toHaveLength(1);
    expect(before.xp).toEqual([expect.objectContaining({ points: 10 })]);
    await expect(page.locator('meta[name="pwa-e2e-release"]')).toHaveCount(0);
    await watchControllerChange(page);
    let otherTab: Page | undefined;
    if (reloadWithController) {
      otherTab = await page.context().newPage();
      await otherTab.goto(releaseServer.origin + '/verbs');
      await expect(otherTab.getByRole('searchbox', { name: 'Buscar verbos' })).toBeVisible();
      await watchControllerChange(otherTab);
    }

    await confirmUpdate(page, releaseServer, 'next', otherTab);

    await waitForControllerChange(page);
    await expect(page.locator('meta[name="pwa-e2e-release"]')).toHaveAttribute('content', 'next');
    await expect(page.getByRole('heading', { name: /Un pequeño paso adelante/ })).toBeVisible();
    const after = await records(page);
    expect(after.sessions).toEqual([
      { ...before.sessions[0], status: 'completed', completedAt: expect.any(String) },
    ]);
    expect(after.attempts).toEqual(before.attempts);
    expect(after.progress).toEqual(before.progress);
    expect(after.xp).toEqual(expect.arrayContaining(before.xp));
    if (otherTab) {
      await waitForControllerChange(otherTab);
      await expect(otherTab.locator('meta[name="pwa-e2e-release"]')).toHaveCount(0);
    }
  });
}

test('reports activation failure when a real worker stays waiting after confirmation', async ({
  page,
  releaseServer,
}) => {
  const before = await startStudy(page, releaseServer.origin);
  await confirmUpdate(page, releaseServer, 'without-activation');

  await expect.poll(async () => (await records(page)).sessions[0].status).toBe('completed');
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistration())?.waiting?.state,
    ),
  ).toBe('installed');
  await expect(page.locator('meta[name="pwa-e2e-release"]')).toHaveCount(0);
  const after = await records(page);
  expect(after.sessions[0].status).toBe('completed');
  expect(after.attempts).toEqual(before.attempts);
  expect(after.progress).toEqual(before.progress);
  expect(after.xp).toEqual(expect.arrayContaining(before.xp));
  await expect(page.locator('.update-notice').getByRole('alert')).toBeVisible({ timeout: 12_000 });
  await expect(
    page.getByRole('button', { name: 'Reintentar actualización', exact: true }),
  ).toBeEnabled();
});
