import { test, expect } from '@playwright/test';
test('read stays written read and speaks isolated sounds in detail and library', async ({
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
  await page.goto('/verbs/read');
  const sounds = ['reed', 'red', 'red'];
  const forms = ['base', 'pastSimple', 'pastParticiple'];
  for (let i = 0; i < forms.length; i++) {
    const button = page.getByRole('button', {
      name: `Escuchar ${forms[i]} de read`,
      exact: true,
    });
    await expect(button).toBeEnabled();
    const card = page.locator('.form-card').nth(i);
    await expect(card.getByRole('heading', { name: 'read', exact: true })).toBeVisible();
    await expect(card).not.toContainText('We ');
    await button.click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __verbquestSpoken: string[] }).__verbquestSpoken,
        ),
      )
      .toEqual(sounds.slice(0, i + 1));
    await expect(card.getByRole('status')).toContainText('Audio reproducido.');
  }
  await expect(page.getByText('Audio aislado desactivado', { exact: false })).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('IPA');
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Escuchar las tres formas de read', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __verbquestSpoken: string[] }).__verbquestSpoken),
    )
    .toEqual(sounds);
  await page.goto('/verbs/go');
  await page.getByRole('button', { name: 'Escuchar base de go', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { __verbquestSpoken: string[] }).__verbquestSpoken.at(-1),
      ),
    )
    .toBe('go');
});
