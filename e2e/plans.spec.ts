import { test, expect } from '@playwright/test';
test('template is copied into a saved plan and starts a session', async ({ page }) => {
  await page.goto('/plans/template-zero');
  await page.getByLabel('Nombre del plan').fill('Mi primera misión');
  await page.getByRole('button', { name: 'Guardar y preparar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Mi primera misión' })).toBeVisible();
  await page.getByRole('button', { name: 'Comenzar sesión' }).click();
  await expect(page.locator('.session-card')).toBeVisible();
  await page.reload();
  await expect(page.locator('.session-card')).toBeVisible();
});
