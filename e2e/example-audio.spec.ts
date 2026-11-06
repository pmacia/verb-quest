import { test, expect } from '@playwright/test';
test('each example has an accessible speaker that plays the full sentence', async ({ page }) => {
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
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/verbs/read');
  const examples = page.locator('.example');
  await expect(examples).toHaveCount(3);
  const sentences: string[] = [];
  for (let i = 0; i < (await examples.count()); i++) {
    const example = examples.nth(i);
    const sentence = (await example.getByRole('heading').innerText()).trim();
    sentences.push(sentence);
    const speaker = example.getByRole('button', {
      name: `Escuchar ejemplo: ${sentence}`,
      exact: true,
    });
    await expect(speaker).toBeEnabled();
    await speaker.click();
    await expect(example.getByRole('status')).toContainText('Audio reproducido.');
    await expect(example.getByRole('status')).toHaveAttribute('title', 'Audio reproducido.');
    await expect(example.getByRole('status').locator('svg')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __verbquestSpoken: string[] }).__verbquestSpoken,
        ),
      )
      .toEqual(sentences);
    await expect(example).not.toContainText('Voz sintética');
  }
  expect(sentences).toHaveLength(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/progress');
  await expect(page.locator('.level-card')).toContainText('0 XP');
});
test('unavailable example audio leaves the sentence and translation accessible', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }),
  );
  await page.goto('/verbs/go');
  const example = page.locator('.example').first();
  const sentence = await example.getByRole('heading').innerText();
  await example.getByRole('button', { name: `Escuchar ejemplo: ${sentence}`, exact: true }).click();
  await expect(example.getByRole('status')).toContainText('Audio no disponible');
  await expect(example.getByRole('heading')).toHaveText(sentence);
  await expect(example.locator('p').first()).not.toBeEmpty();
});
