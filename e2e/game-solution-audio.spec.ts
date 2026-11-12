import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Exercise the real app and speech service; replace only the device's speech API.
  await page.addInitScript(() => {
    const state = { spoken: [] as string[], cancellations: 0 };
    Object.assign(window, { solutionSpeech: state });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: class {
        constructor(public text: string) {}
      },
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [
          { voiceURI: 'test-uk', lang: 'en-GB', name: 'Test English', localService: true },
        ],
        addEventListener() {},
        removeEventListener() {},
        pause() {},
        resume() {},
        cancel() {
          state.cancellations++;
        },
        speak(utterance: { text: string; onstart?: () => void }) {
          state.spoken.push(utterance.text);
          utterance.onstart?.();
        },
      },
    });
  });
});
async function speech(page: Page) {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          solutionSpeech: { spoken: string[]; cancellations: number };
        }
      ).solutionSpeech,
  );
}
async function start(page: Page, game: string, verb: string) {
  await page.goto('/games');
  await page.getByLabel('Selección de verbos').selectOption('manual');
  await page.getByLabel(verb, { exact: true }).check();
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: game, exact: true }) })
    .getByRole('button', { name: 'Jugar ahora' })
    .click();
  await expect(page.locator('.question-prompt')).toBeVisible();
}
test('flashcards speak only after reveal, once, and stop before the next question', async ({
  page,
}) => {
  await start(page, 'Flashcards', 'read · leer');
  expect((await speech(page)).spoken).toEqual([]);
  const prompt = await page.locator('.question-prompt').innerText();
  await page.getByRole('button', { name: 'Revelar respuesta' }).click();
  await expect(page.locator('.flashcard-answer')).toHaveText('read');
  const expected = prompt.includes('forma base') ? 'reed' : 'red';
  await expect.poll(async () => (await speech(page)).spoken).toEqual([expected]);
  await page.getByRole('button', { name: 'Lo sabía', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Valoración guardada' })).toBeVisible();
  expect((await speech(page)).spoken).toEqual([expected]);
  const cancellations = (await speech(page)).cancellations;
  await page.getByRole('button', { name: /Siguiente pregunta/ }).click();
  await expect(page.getByRole('button', { name: 'Revelar respuesta' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Escuchar solución' })).toHaveCount(0);
  expect((await speech(page)).cancellations).toBeGreaterThan(cancellations);
});
test('a wrong written answer plays the correction and can be replayed', async ({ page }) => {
  await page.goto('/plans/new');
  await page.getByLabel('Origen de los verbos').selectOption('manual');
  await page.getByLabel('go · ir', { exact: true }).check();
  await page.getByLabel('Aprender y repasar todas las habilidades', { exact: true }).uncheck();
  await page.getByLabel('Escritura', { exact: true }).check();
  const modalities = page
    .locator('fieldset')
    .filter({ has: page.getByText('Modalidades', { exact: true }) });
  for (const check of await modalities.getByRole('checkbox').all()) await check.uncheck();
  await page.getByLabel('Memoria y escritura', { exact: true }).check();
  await page.getByRole('button', { name: 'Guardar y preparar sesión' }).click();
  await page.getByRole('button', { name: 'Comenzar sesión' }).click();
  const prompt = await page.locator('.question-prompt').innerText();
  const expected = prompt.includes('pasado simple')
    ? 'went'
    : prompt.includes('participio')
      ? 'gone'
      : 'go';
  await page.getByLabel('Tu respuesta', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vamos a darle otra vuelta' })).toBeVisible();
  await expect.poll(async () => (await speech(page)).spoken).toEqual([expected]);
  await page.getByRole('button', { name: 'Detener audio' }).click();
  await page.getByRole('button', { name: 'Escuchar solución' }).click();
  await expect.poll(async () => (await speech(page)).spoken).toEqual([expected, expected]);
});
test('sentence correction speaks the completed English example', async ({ page }) => {
  await start(page, 'Completa la frase', 'go · ir');
  await page.getByLabel('Tu respuesta', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(page.locator('.feedback')).toBeVisible();
  const explanation = await page.locator('.feedback p').first().innerText();
  const sentence = explanation.split(' — ')[0];
  expect(sentence).not.toContain('____');
  await expect.poll(async () => (await speech(page)).spoken).toEqual([sentence]);
});

test('visual listening fallback remains silent until the student asks for audio', async ({
  page,
}) => {
  await start(page, 'Audio Detective', 'read · leer');
  await page.getByRole('button', { name: 'No puedo usar audio · alternativa visual' }).click();
  await page.getByLabel('Tu respuesta', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(page.locator('.feedback')).toBeVisible();
  expect((await speech(page)).spoken).toEqual([]);
  await page.getByRole('button', { name: 'Escuchar solución' }).click();
  await expect.poll(async () => (await speech(page)).spoken.length).toBe(1);
});
