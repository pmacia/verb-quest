import { test, expect } from '@playwright/test';
test('normal mode offers broad final-sound groups; strict mode persists and controls IPA messages', async ({
  page,
}) => {
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Forma del filtro fonético', exact: true }),
  ).toHaveValue('pastParticiple');
  const sound = page.getByLabel('Sonido final', { exact: true });
  for (const [ending, min] of [
    ['t', 30],
    ['d', 15],
    ['n', 35],
  ] as const) {
    await sound.fill(ending);
    await expect.poll(() => page.locator('.verb-row').count()).toBeGreaterThan(min);
  }
  await page.goto('/verbs/write');
  await expect(page.locator('main')).not.toContainText('IPA');
  await page.goto('/settings');
  const toggle = page.getByRole('switch', { name: 'Modo IPA estricto', exact: true });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(toggle).toBeChecked();
  await page.goto('/verbs/write');
  await expect(
    page.getByText('IPA propuesta · pendiente de revisión', { exact: true }).first(),
  ).toBeVisible();
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByLabel('Sonido final (IPA validada)', { exact: true }).fill('n');
  await expect(page.locator('.verb-row')).toHaveCount(1);
  await page.goto('/settings');
  await toggle.click();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.goto('/verbs/write');
  await expect(page.locator('main')).not.toContainText('IPA');
});
