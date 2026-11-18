import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function speechBrowser(page: Page, recognition = true) {
  await page.addInitScript(
    ({ recognition }) => {
      const state = {
        alternatives: ['buy bought bought'],
        issue: '',
        audioUnavailable: false,
        noTranscription: false,
        delayCue: false,
        stops: 0,
        aborts: 0,
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
            if (utterance.text === 'Tu turno' && state.delayCue) {
              Object.assign(window, { reviewCue: utterance });
              return;
            }
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
        onaudiostart: any;
        onaudioend: any;
        onend: any;
        onerror: any;
        onresult: any;
        active = false;
        start() {
          this.active = true;
          Object.assign(window, { reviewRecognition: this });
          state.languages.push(this.lang);
          queueMicrotask(() => {
            if (!this.active) return;
            if (state.issue) this.onerror?.({ error: state.issue });
            else {
              this.onstart?.();
              if (!state.audioUnavailable && this.active) this.onaudiostart?.();
            }
          });
        }
        stop() {
          state.stops++;
          this.finishPhrase();
        }
        finishPhrase() {
          if (!this.active) return;
          this.active = false;
          queueMicrotask(() => {
            this.onaudioend?.();
            if (state.audioUnavailable || state.noTranscription) {
              this.onend?.();
              return;
            }
            const result = Object.assign(
              state.alternatives.map((transcript) => ({ transcript })),
              { isFinal: true },
            );
            this.onresult?.({ resultIndex: 0, results: [result] });
            this.onend?.();
          });
        }
        abort() {
          state.aborts++;
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
  await expect(
    page.getByRole('heading', { name: 'Repaso de verbos', level: 1, exact: true }),
  ).toBeVisible();
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
test('review cards focus their inputs and discarding dictation restores the previous draft', async ({
  page,
}) => {
  await speechBrowser(page);
  await page.goto('/settings');
  await page
    .getByLabel('Comprobación de respuestas dictadas', { exact: true })
    .selectOption('manual');
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await page
    .locator('.vr-column')
    .first()
    .click({ position: { x: 8, y: 8 } });
  await expect(page.getByRole('textbox', { name: 'Infinitivo', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Infinitivo', exact: true }).fill('by');
  const mic = page.getByRole('button', {
    name: /^(Dictar las tres formas|Repetir dictado de las tres formas)$/,
  });
  await mic.focus();
  await page.keyboard.down('Space');
  await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'listening');
  await expect(page.getByRole('button', { name: 'Terminar dictado' })).toHaveCount(0);
  await page.evaluate(() => {
    const interim = Object.assign([{ transcript: 'buy bought bought' }], { isFinal: false });
    (window as any).reviewRecognition.onresult({ resultIndex: 0, results: [interim] });
  });
  await expect(page.getByRole('textbox', { name: 'Participio', exact: true })).toHaveValue(
    'bought',
  );
  await expect(page.locator('.vr-main-mic')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.up('Space');
  await expect(page.getByRole('textbox', { name: 'Pasado', exact: true })).toHaveValue('bought');
  await mic.focus();
  await page.keyboard.down('Space');
  await expect(page.locator('.vr-repeat')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.up('Space');
  await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'idle');
  await page.getByRole('button', { name: 'Descartar dictado', exact: true }).click();
  // Discarding the repeated dictation recovers the previous spoken draft.
  await expect(page.getByRole('textbox', { name: 'Infinitivo', exact: true })).toHaveValue('buy');
  await expect(page.getByRole('button', { name: 'Descartar dictado', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Descartar dictado', exact: true })).toHaveCount(0);
  // Capture from a partially written draft again, then verify its restoration.
  await page.getByRole('textbox', { name: 'Infinitivo', exact: true }).fill('by');
  await page.getByRole('textbox', { name: 'Pasado', exact: true }).fill('');
  await page.getByRole('textbox', { name: 'Participio', exact: true }).fill('');
  // Assistive technology activates a button rather than holding a pointer.
  await mic.dispatchEvent('click', { detail: 0 });
  await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'listening');
  await mic.dispatchEvent('click', { detail: 0 });
  await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'idle');
  await page.getByRole('button', { name: 'Descartar dictado', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Infinitivo', exact: true })).toHaveValue('by');
  await expect(page.getByRole('textbox', { name: 'Pasado', exact: true })).toHaveValue('');
  expect((await records(page)).attempts).toHaveLength(0);
  await expect(page.getByRole('button', { name: 'Comprobar', exact: true })).toBeDisabled();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  if (test.info().project.name === 'chromium') {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: '/tmp/verbquest-review-integrated-mobile.png',
      fullPage: true,
      animations: 'disabled',
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(250);
    await page.screenshot({
      path: '/tmp/verbquest-review-integrated-dark.png',
      fullPage: true,
      animations: 'disabled',
    });
  }
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
});
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
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  const pastLabel = page.locator('.vr-column.is-incorrect label');
  await expect(pastLabel).toHaveCSS('color', 'rgb(255, 153, 174)');
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });
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
test('automatic voice checks the visible transcript and leaves incorrect primary answers for review', async ({
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
    (window as any).reviewSpeech.alternatives = ['buy bot bought', 'buy bought bought'];
  });
  await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Revisa lo que he entendido' }),
  ).toBeVisible();
  data = await records(page);
  expect(data.attempts).toHaveLength(1);
  await expect(page.getByRole('textbox', { name: 'Pasado', exact: true })).toHaveValue('bot');
  await page.getByRole('textbox', { name: 'Pasado', exact: true }).fill('bought');
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

test('be with both past forms goes directly to OK after release despite secondary alternatives', async ({
  page,
}) => {
  await speechBrowser(page);
  await start(page, 'be');
  await page.evaluate(() => {
    (window as any).reviewSpeech.alternatives = [
      'be was were been',
      'be were was been',
      'bee was bean',
    ];
  });
  const mic = page.getByRole('button', { name: 'Dictar las tres formas', exact: true });
  await mic.focus();
  await page.keyboard.down('Space');
  expect((await records(page)).attempts).toHaveLength(0);
  await page.keyboard.up('Space');
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Pasado', exact: true })).toHaveValue(
    'was / were',
  );
  const attempts = (await records(page)).attempts;
  expect(attempts).toHaveLength(1);
  expect(attempts[0].coverageTargetIds).toContain('pastSimple:was');
  expect(attempts[0].coverageTargetIds).toContain('pastSimple:were');
});

for (const missing of ['audio', 'transcription'] as const)
  test(`a second session without ${missing} recovers and offers native keyboard dictation`, async ({
    page,
  }) => {
    await speechBrowser(page);
    await start(page);
    await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
    await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
    await finish(page);
    await start(page);
    await page.getByRole('textbox', { name: 'Infinitivo', exact: true }).fill('buy');
    await page.evaluate((missing) => {
      (window as any).reviewSpeech.audioUnavailable = missing === 'audio';
      (window as any).reviewSpeech.noTranscription = missing === 'transcription';
    }, missing);
    const mic = page.getByRole('button', { name: 'Dictar las tres formas', exact: true });
    await mic.focus();
    await page.keyboard.down('Space');
    await expect(page.locator('.vr-dock')).toHaveAttribute(
      'data-state',
      missing === 'audio' ? 'preparing' : 'listening',
    );
    await expect(
      page.getByRole('status').filter({
        hasText: missing === 'audio' ? 'no ha abierto el micrófono' : 'no está enviando texto',
      }),
    ).toBeVisible({ timeout: 11000 });
    await page.keyboard.up('Space');
    await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'idle');
    await page.getByRole('button', { name: 'Usar dictado del teclado', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Pasado', exact: true })).toBeFocused();
    await expect(page.getByRole('textbox', { name: 'Infinitivo', exact: true })).toHaveValue('buy');
    expect((await records(page)).attempts).toHaveLength(1);
  });

async function captureSetting(page: Page, mode: string) {
  await page.goto('/settings');
  await page.getByLabel('Activación del micrófono', { exact: true }).selectOption(mode);
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
}
test('compatible capture uses a cue, natural phrase endings and preserves the original mode', async ({
  page,
}) => {
  await speechBrowser(page);
  await captureSetting(page, 'compatible');
  await page
    .getByLabel('Comprobación de respuestas dictadas', { exact: true })
    .selectOption('manual');
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await start(page);
  await expect(page.getByText('Toca para hablar', { exact: true })).toBeVisible();
  for (let attempt = 0; attempt < 2; attempt++) {
    await page
      .getByRole('button', {
        name: attempt ? 'Repetir dictado de las tres formas' : 'Dictar las tres formas',
        exact: true,
      })
      .click();
    await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'listening');
    expect(await page.evaluate(() => (window as any).reviewRecognition.continuous)).toBe(false);
    expect(await page.evaluate(() => (window as any).reviewSpeech.stops)).toBe(0);
    await page.evaluate(() => (window as any).reviewRecognition.finishPhrase());
    await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'idle');
    await expect(page.getByRole('textbox', { name: 'Pasado', exact: true })).toHaveValue('bought');
  }
  expect(
    await page.evaluate(
      () => (window as any).reviewSpeech.spoken.filter((s: string) => s === 'Tu turno').length,
    ),
  ).toBe(2);
  expect((await records(page)).attempts).toHaveLength(0);
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  await finish(page);
  await page.goto('/settings');
  await expect(page.getByLabel('Activación del micrófono', { exact: true })).toHaveValue(
    'compatible',
  );
  await captureSetting(page, 'hold');
  await start(page);
  await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).reviewSpeech.stops)).toBeGreaterThan(0);
});
test('compatible capture cancels pending cues and active microphones without late restarts', async ({
  page,
}) => {
  await speechBrowser(page);
  await captureSetting(page, 'compatible');
  await start(page);
  await page.evaluate(() => {
    (window as any).reviewSpeech.delayCue = true;
  });
  await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
  await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'preparing');
  await page.getByRole('button', { name: 'Cancelar dictado', exact: true }).click();
  await page.evaluate(() => (window as any).reviewCue.onend?.());
  expect(await page.evaluate(() => (window as any).reviewSpeech.languages)).toEqual([]);
  await page.evaluate(() => {
    (window as any).reviewSpeech.delayCue = false;
  });
  await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
  await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'listening');
  await page.getByRole('button', { name: 'Cancelar dictado', exact: true }).click();
  await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'idle');
  expect((await records(page)).attempts).toHaveLength(0);
  expect(await page.evaluate(() => (window as any).reviewSpeech.aborts)).toBe(1);
  await page.evaluate(() => {
    (window as any).reviewSpeech.delayCue = true;
  });
  await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
  await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'preparing');
  await page.getByRole('link', { name: 'Juegos', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Otra forma de aprender/ })).toBeVisible();
  await page.evaluate(() => (window as any).reviewCue.onend?.());
  expect(await page.evaluate(() => (window as any).reviewSpeech.languages)).toHaveLength(1);
});

test('automatic capture detects a desktop-like iPad and a manual hold choice overrides it', async ({
  page,
}) => {
  await speechBrowser(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
  });
  await start(page);
  await expect(page.getByText('Toca para hablar', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Dictar las tres formas', exact: true }).click();
  await expect(page.locator('.vr-dock')).toHaveAttribute('data-state', 'listening');
  await page.evaluate(() => (window as any).reviewRecognition.finishPhrase());
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  await finish(page);
  await captureSetting(page, 'hold');
  await start(page);
  await expect(page.getByText('Mantén para hablar', { exact: true })).toBeVisible();
});
