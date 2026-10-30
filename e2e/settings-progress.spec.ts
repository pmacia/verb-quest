import { test, expect } from '@playwright/test';
test('preferences persist and reset needs two confirmations', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await page.getByLabel('Reducir movimiento').check();
  await page.getByRole('button', { name: 'Guardar preferencias' }).click();
  await expect(page.getByRole('status')).toContainText('Preferencias guardadas');
  await page.reload();
  await expect(page.getByLabel('Tema', { exact: true })).toHaveValue('dark');
  await expect(page.getByLabel('Reducir movimiento')).toBeChecked();
  await page.getByRole('button', { name: 'Reiniciar progreso', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Revisar borrado' })).toBeVisible();
  await page.getByRole('button', { name: 'Entiendo, continuar' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirmación final' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
