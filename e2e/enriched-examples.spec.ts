import { test, expect } from '@playwright/test';
test('enriched main senses and revised contexts appear in verb detail and survive reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [verb, count, sentence] of [
    ['become', 4, 'The sky became dark before the storm.'],
    ['break', 5, 'I broke a glass while washing up.'],
    ['spend', 5, 'I spent five euros on a notebook.'],
    ['know', 5, 'I have known Sara since primary school.'],
  ] as const) {
    await page.goto(`/verbs/${verb}`);
    await expect(page.locator('.example')).toHaveCount(count);
    await expect(page.getByRole('heading', { name: sentence, exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: `Escuchar ejemplo: ${sentence}`, exact: true }),
    ).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.reload();
  await expect(page.locator('.example')).toHaveCount(5);
  await expect(page.locator('.example').filter({ hasText: 'We can know the answer.' })).toHaveCount(
    0,
  );
  await page.goto('/verbs/spell');
  await expect(
    page.getByRole('heading', { name: 'We spelled our names in English yesterday.', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'We have spelt our names in English.', exact: true }),
  ).toBeVisible();
});
