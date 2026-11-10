import { test, expect } from '@playwright/test';
test('main definitions appear only in detail, between badges and the three forms', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/verbs/arise');
  const section = page.getByRole('region', { name: 'Meaning In simple English' });
  await expect(section).toContainText(
    'To begin to happen or appear, especially a problem or situation.',
  );
  await expect(section.locator('.tag')).toHaveText(['UK', 'US']);
  expect(
    await page
      .locator('.vd-definitions')
      .evaluate(
        (el) =>
          !!el.previousElementSibling?.classList.contains('page-heading') &&
          !!el.nextElementSibling?.classList.contains('vd-form-toolbar'),
      ),
  ).toBe(true);
  await expect(section.locator('a')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/verbs');
  await expect(page.locator('.vd-definitions')).toHaveCount(0);
});
test('editor persists definitions, merges equal UK/US text and respects source visibility', async ({
  page,
}) => {
  await page.goto('/editor/verbs/arise');
  await page.getByRole('button', { name: 'Datos del verbo', exact: true }).click();
  const text = 'To appear when a new situation develops.';
  await page.getByLabel('Texto de definición 1', { exact: true }).fill(text);
  await page.getByLabel('US de definición 1', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Añadir definición', exact: true }).click();
  await page.getByLabel('Texto de definición 2', { exact: true }).fill(text);
  await page.getByLabel('UK de definición 2', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Guardar verbo', exact: true }).click();
  await expect(page).toHaveURL(/\/verbs\/arise$/);
  await expect(page.locator('.vd-definitions li')).toHaveCount(1);
  await expect(page.locator('.vd-definitions .tag')).toHaveText(['UK', 'US']);
  await page.reload();
  await expect(page.locator('.vd-definitions')).toContainText(text);
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Mostrar fuentes y revisión', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.goto('/verbs/arise');
  await expect(page.locator('.vd-definitions')).toContainText('Pendiente de revisión.');
  await expect(page.locator('.vd-definitions a')).toHaveAttribute(
    'href',
    'https://dictionary.cambridge.org/dictionary/english/arise',
  );
});
