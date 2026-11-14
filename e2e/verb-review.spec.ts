import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function speechBrowser(page: Page, recognition = true) {
  await page.addInitScript(
    ({ recognition }) => {
      const state = {
        alternatives: ['buy bought bought'],
        issue: '',
        languages: [] as string[],
        spoken: [] as string[],
      };
      Object.assign(window, { reviewSpeech: state });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        configurable: true,
        value: class {
          constructor(public text: string) {}
        },
      });
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          getVoices: () =>
            ['en-GB', 'en-US', 'es-ES'].map((lang) => ({
              voiceURI: lang,
              lang,
              name: lang,
              localService: true,
            })),
          addEventListener() {},
          removeEventListener() {},
          cancel() {},
          pause() {},
          resume() {},
          speak(utterance: any) {
            state.spoken.push(utterance.text);
            queueMicrotask(() => {
              utterance.onstart?.();
              utterance.onend?.();
            });
          },
        },
      });
      class Recognition {
        lang = '';
        onstart: any;
        onend: any;
        onerror: any;
        onresult: any;
        active = false;
        start() {
          this.active = true;
          state.languages.push(this.lang);
          queueMicrotask(() => {
            if (!this.active) return;
            if (state.issue) this.onerror?.({ error: state.issue });
            else this.onstart?.();
          });
        }
        stop() {
          if (!this.active) return;
          this.active = false;
          queueMicrotask(() => {
            const result = Object.assign(
              state.alternatives.map((transcript) => ({ transcript })),
              { isFinal: true },
            );
            this.onresult?.({ resultIndex: 0, results: [result] });
            this.onend?.();
          });
        }
        abort() {
          this.active = false;
        }
      }
      Object.defineProperty(window, 'SpeechRecognition', {
        configurable: true,
        value: recognition ? Recognition : undefined,
      });
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        configurable: true,
        value: undefined,
      });
    },
    { recognition },
  );
}
async function records(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('verbquest');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    async function rows(table: string): Promise<any[]> {
      return new Promise((resolve, reject) => {
        const req = db.transaction(table).objectStore(table).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    const data = {
      attempts: await rows('attempts'),
      sessions: await rows('sessions'),
      progress: await rows('progress'),
    };
    db.close();
    return data;
  });
}
async function start(page: Page, verb = 'buy', language = 'es') {
  await page.goto('/games');
  await page.getByLabel('Selección de verbos').selectOption('manual');
  await page.getByRole('checkbox', { name: new RegExp(`^${verb} ·`) }).check();
  const card = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Repaso de verbos', exact: true }) });
  await card
    .getByRole('combobox', { name: 'Idioma de la pista', exact: true })
    .selectOption(language);
  await card.getByRole('button', { name: 'Jugar ahora' }).click();
  await expect(page.getByRole('heading', { name: 'Repaso de verbos', level: 1, exact: true })).toBeVisible();
}
async function answer(page: Page, values: string[]) {
  for (const [index, label] of ['Infinitivo', 'Pasado', 'Participio'].entries())
    await page.getByRole('textbox', { name: label, exact: true }).fill(values[index]);
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
}
async function finish(page: Page) {
  await page.getByRole('button', { name: 'Terminar sesión', exact: true }).click();
  await page.waitForURL(/summary=/);
}
test('keyboard review restores a paused draft, corrects columns and repeats until solved', async ({
  page,
}) => {
  await speechBrowser(page, false);
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await expect(
    page.getByRole('button', { name: 'Dictar las tres formas', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Infinitivo', exact: true }).fill('buy');
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu sesión está a salvo' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Infinitivo', exact: true })).toHaveValue('buy');
  await answer(page, ['buy', 'buy', 'bought']);
  await expect(page.locator('.vr-column.is-incorrect')).toHaveCount(1);
  await expect(page.locator('.vr-column.is-correct')).toHaveCount(2);
  await expect
    .poll(async () =>
      page.evaluate(() => (window as any).reviewSpeech.spoken.includes('buy. bought. bought')),
    )
    .toBe(true);
  await page.getByRole('button', { name: /Siguiente pregunta/ }).click();
  await expect(page.getByRole('textbox', { name: 'Infinitivo', exact: true })).toHaveValue('');
  await answer(page, ['buy', 'bought', 'bought']);
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  const data = await records(page);
  expect(data.attempts).toHaveLength(2);
  expect(data.attempts.find((a) => a.correct).assisted).toBe(true);
  expect(data.progress.every((p) => p.skill === 'recall')).toBe(true);
  await page.screenshot({ animations: 'disabled' });
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
});
test('automatic voice accepts equivalent alternatives but asks to review disagreement', async ({
  page,
}) => {
  await speechBrowser(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: '/tmp/verb-review-mobile.png',
      fullPage: false,
      animations: 'disabled',
    });
  await page.evaluate(() => {
    (window as any).reviewSpeech.alternatives = ['buy bought bought', 'by bought bought'];
  });
  await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  let data = await records(page);
  expect(data.attempts).toHaveLength(1);
  expect(data.attempts[0].inputMethod).toBe('voice');
  expect(data.attempts[0].isWritten).toBe(false);
  expect(data.progress[0].stage).toBe(1);
  await finish(page);
  await start(page);
  await page.evaluate(() => {
    (window as any).reviewSpeech.alternatives = ['buy bought bought', 'buy bot bought'];
  });
  await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Revisa lo que he entendido' }),
  ).toBeVisible();
  data = await records(page);
  expect(data.attempts).toHaveLength(1);
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  expect((await records(page)).attempts).toHaveLength(2);
  await finish(page);
  await start(page);
  await page.getByRole('textbox', { name: 'Infinitivo', exact: true }).fill('by');
  await page.getByRole('textbox', { name: 'Pasado', exact: true }).fill('bought');
  await page.evaluate(() => {
    (window as any).reviewSpeech.alternatives = ['bought'];
  });
  await page.getByRole('button', { name: 'Dictar Participio', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Participio', exact: true })).toHaveValue(
    'bought',
  );
  expect((await records(page)).attempts).toHaveLength(2);
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(page.locator('.vr-column.is-incorrect')).toHaveCount(1);
  expect((await records(page)).attempts).toHaveLength(3);
});
test('manual voice setting and US English prompts survive navigation without auto-submitting drafts', async ({
  page,
}) => {
  await speechBrowser(page);
  await page.goto('/settings');
  await page
    .getByRole('combobox', { name: 'Comprobación de respuestas dictadas', exact: true })
    .selectOption('manual');
  await page.getByLabel('Dialecto preferido', { exact: true }).selectOption('us');
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await start(page, 'get', 'en');
  await page.evaluate(() => {
    (window as any).reviewSpeech.alternatives = ['get got gotten'];
  });
  await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Participio', exact: true })).toHaveValue(
    'gotten',
  );
  await expect(
    page.getByRole('status').filter({ hasText: 'Revisa las tres formas' }),
  ).toBeVisible();
  expect((await records(page)).attempts).toHaveLength(0);
  expect(await page.evaluate(() => (window as any).reviewSpeech.languages)).toEqual(['en-US']);
  await page.goto('/settings');
  await expect(
    page.getByRole('combobox', { name: 'Comprobación de respuestas dictadas', exact: true }),
  ).toHaveValue('manual');
  await page
    .getByRole('combobox', { name: 'Comprobación de respuestas dictadas', exact: true })
    .selectOption('automatic');
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.goto('/study');
  await expect(page.getByRole('textbox', { name: 'Participio', exact: true })).toHaveValue(
    'gotten',
  );
  expect((await records(page)).attempts).toHaveLength(0);
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  expect((await records(page)).attempts[0].coverageTargetIds).not.toContain('base');
});
test('denied microphone permission keeps keyboard input available without recording a failure', async ({
  page,
}) => {
  await speechBrowser(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await start(page);
  await page.evaluate(() => {
    (window as any).reviewSpeech.issue = 'not-allowed';
  });
  await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'permiso al micrófono' })).toBeVisible();
  expect((await records(page)).attempts).toHaveLength(0);
  await answer(page, ['buy', 'bought', 'bought']);
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
  await page.screenshot({ animations: 'disabled' });
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
});
