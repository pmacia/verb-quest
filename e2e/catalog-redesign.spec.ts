import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('catalog density preserves selection and filters, and detail shows specific translations', async ({
  page,
}) => {
  await page.goto('/verbs');
  await page.getByLabel('Buscar verbos').fill('go');
  await page.getByRole('checkbox', { name: 'Seleccionar go', exact: true }).check();
  await page.getByRole('button', { name: 'Vista compacta', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Seleccionar go', exact: true })).toBeChecked();
  await expect(page.getByLabel('Buscar verbos')).toHaveValue('go');
  await page.getByRole('button', { name: 'Vista detallada', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Seleccionar go', exact: true })).toBeChecked();
  await page.goto('/verbs/go');
  await expect(page.getByRole('heading', { name: 'went', exact: true })).toBeVisible();
  await expect(page.locator('.form-card').nth(1)).toContainText('fui / fue');
  await expect(page.locator('.form-card').nth(2)).toContainText('ido');
  await expect(page.locator('.page-heading')).toContainText('ir');
  await expect(page.locator('.page-heading .verb-badges')).not.toBeEmpty();
  await page.goto('/verbs/be');
  await expect(page.getByRole('heading', { name: 'was', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'were', exact: true })).toBeVisible();
  await expect(page.locator('.form-card').nth(1)).toContainText('estuviste');
});

test('compact mobile catalogue remains readable and accessible in dark system theme', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/verbs');
  await page.getByLabel('Buscar verbos').fill('read');
  await page.getByRole('button', { name: 'Vista compacta', exact: true }).click();
  const read = page
    .locator('.catalog-item-compact')
    .filter({ has: page.getByRole('checkbox', { name: 'Seleccionar read', exact: true }) });
  await expect(read).toHaveCount(1);
  await expect(read).toContainText('/riːd/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
