import { test, expect } from '@playwright/test';
test('ending fields offer examples and still accept custom endings', async ({ page }) => {
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  const spelling = page.getByLabel('Terminación escrita (pasado)', { exact: true });
  const sound = page.getByLabel('Sonido final', { exact: true });
  await expect(spelling).toHaveAttribute('list', 'spelling-ending-examples');
  await expect(sound).toHaveAttribute('list', 'phonetic-ending-examples');
  expect(
    await page
      .locator('#spelling-ending-examples option')
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value)),
  ).toEqual(['ought', 'ew', 'ent']);
  expect(
    await page
      .locator('#phonetic-ending-examples option')
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value)),
  ).toEqual(['/t/', '/d/', '/n/']);
  await spelling.fill('ought');
  await expect(page.getByRole('link', { name: 'Ver ficha de buy', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver ficha de go', exact: true })).toHaveCount(0);
  await spelling.fill('ank');
  await expect(page.getByRole('link', { name: 'Ver ficha de drink', exact: true })).toBeVisible();
  await spelling.fill('');
  await page
    .getByRole('combobox', { name: 'Forma del filtro fonético', exact: true })
    .selectOption('pastParticiple');
  await page
    .getByRole('combobox', { name: 'Dialecto del filtro fonético', exact: true })
    .selectOption('us');
  await sound.fill('/n/');
  await expect(page.getByRole('link', { name: 'Ver ficha de arise', exact: true })).toBeVisible();
  await sound.fill('ən');
  await expect(page.getByRole('link', { name: 'Ver ficha de arise', exact: true })).toBeVisible();
  await sound.fill('');
  await expect(page.getByRole('link', { name: 'Ver ficha de buy', exact: true })).toBeVisible();
});
