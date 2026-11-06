import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('refined detail keeps variant translations and compact accessible audio in narrow and wide layouts', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/verbs/burn');
  await expect(page.locator('.page-heading .large')).toHaveText('quemar');
  await expect(page.locator('.vd-verb-icon')).toHaveText('🔥');
  await expect(page.locator('.verb-form-column')).toHaveCount(3);
  const past = page.getByRole('region', { name: 'Pasado simple', exact: true });
  await expect(past.getByRole('heading', { name: 'burnt', exact: true })).toBeVisible();
  await expect(past.getByRole('heading', { name: 'burned', exact: true })).toBeVisible();
  await expect(past.locator('.form-translation')).toHaveCount(2);
  await expect(page.locator('.verb-badges .tag svg').first()).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const toolbar = await page.locator('.vd-form-toolbar').boundingBox();
    expect(toolbar!.height).toBeLessThanOrEqual(34);
    const sound = await past.locator('.form-sound').first().boundingBox();
    expect(sound!.height).toBeLessThanOrEqual(30);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Cómo leer los sonidos', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Cómo leer los símbolos IPA', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Cómo leer los sonidos', exact: true }),
  ).toBeFocused();
  await page.screenshot({ animations: 'disabled' });
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole('link', { name: 'Editar ficha', exact: true }).click();
  await expect(page.getByLabel('Forma base', { exact: true })).toHaveValue('burn');
});
