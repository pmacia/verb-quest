import { test, expect } from '@playwright/test';
test('individual audio announces its word, exposes stop state and respects an explicit dialect', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const spoken: { text: string; lang: string }[] = [];
    const pending: { onend: () => void }[] = [];
    Object.defineProperty(window, '__spokenForms', { value: spoken });
    Object.defineProperty(window, '__finishForm', {
      value: (index: number) => pending[index].onend(),
    });
    const voices = [
      { voiceURI: 'test-uk', lang: 'en-GB', name: 'Test UK', localService: true },
      { voiceURI: 'test-us', lang: 'en-US', name: 'Test US', localService: true },
    ];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => voices,
        addEventListener() {},
        removeEventListener() {},
        pause() {},
        resume() {},
        cancel() {},
        speak(u: { text: string; lang: string; onstart: () => void; onend: () => void }) {
          spoken.push({ text: u.text, lang: u.lang });
          pending.push(u);
          u.onstart();
        },
      },
    });
  });
  await page.goto('/settings');
  await page.getByLabel('Voz sintética', { exact: true }).selectOption('test-uk');
  await page
    .getByRole('switch', { name: 'Mostrar detalles técnicos del audio', exact: true })
    .check();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.goto('/verbs/read');
  await page.getByRole('button', { name: 'Escuchar pastSimple de read', exact: true }).click();
  await expect(page.locator('.catalog-audio-status')).toContainText('Reproduciendo read');
  await page.getByRole('button', { name: 'Detener pastSimple de read', exact: true }).click();
  await page
    .getByRole('button', { name: 'Escuchar pastSimple de read: read en US', exact: true })
    .click();
  const stop = page.getByRole('button', {
    name: 'Detener pastSimple de read: read en US',
    exact: true,
  });
  await expect(stop).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { __spokenForms: { text: string; lang: string }[] }).__spokenForms.at(
          -1,
        ),
      ),
    )
    .toEqual({ text: 'red', lang: 'en-US' });
  await page.evaluate(() =>
    (window as unknown as { __finishForm: (index: number) => void }).__finishForm(0),
  );
  await expect(stop).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() =>
    (window as unknown as { __finishForm: (index: number) => void }).__finishForm(1),
  );
  await expect(page.locator('.catalog-audio-status')).toContainText('Test US');
  await expect(page.locator('.catalog-audio-status')).toContainText('local');
  await page.goto('/verbs');
  await page.getByLabel('Buscar verbos').fill('read');
  await page.getByRole('button', { name: 'Vista detallada', exact: true }).click();
  await page.getByRole('button', { name: 'Escuchar las tres formas de read', exact: true }).click();
  await page
    .getByRole('button', { name: 'Escuchar pastSimple de read: read en UK', exact: true })
    .click();
  await page.evaluate(() =>
    (window as unknown as { __finishForm: (index: number) => void }).__finishForm(0),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __spokenForms: { text: string; lang: string }[] }).__spokenForms,
      ),
    )
    .toEqual([
      { text: 'reed', lang: 'en-GB' },
      { text: 'red', lang: 'en-GB' },
    ]);
  await page.evaluate(() =>
    (window as unknown as { __finishForm: (index: number) => void }).__finishForm(1),
  );
});
