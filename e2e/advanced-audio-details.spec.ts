import { test, expect } from '@playwright/test';
test('voice details are optional in detail and library while success remains visible', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    Object.defineProperty(window, '__verbquestSpoken', { value: spoken });
    const voices = [{ voiceURI: 'test-uk', lang: 'en-GB', name: 'Test UK', localService: true }];
    let timer: ReturnType<typeof setTimeout>;
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
        cancel() {
          clearTimeout(timer);
        },
        speak(u: { text: string; onstart: () => void; onend: () => void }) {
          spoken.push(u.text);
          u.onstart();
          timer = setTimeout(() => u.onend(), 15);
        },
      },
    });
  });
  await page.goto('/verbs/go');
  await page.getByRole('button', { name: 'Escuchar base de go', exact: true }).click();
  await expect(page.locator('.catalog-audio-status')).toContainText('Audio reproducido.');
  await expect(page.locator('main')).not.toContainText('Test UK');
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Escuchar las tres formas de go', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Tres formas de go reproducidas.');
  await expect(page.locator('main')).not.toContainText('Test UK');
  await page.goto('/settings');
  await page
    .getByRole('switch', { name: 'Mostrar detalles técnicos del audio', exact: true })
    .check();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.goto('/verbs/go');
  await page.getByRole('button', { name: 'Escuchar base de go', exact: true }).click();
  await expect(page.locator('.catalog-audio-status')).toContainText('Voz sintética: Test UK');
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Escuchar las tres formas de go', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Voz sintética: Test UK');
});
