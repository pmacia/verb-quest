import { test, expect } from '@playwright/test';
test('quick theme follows the effective system theme and persists explicit changes', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Cambiar a modo claro', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('/settings');
  await page.getByLabel('Tema', { exact: true }).selectOption('system');
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Cambiar a modo claro', exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(
    page.getByRole('button', { name: 'Cambiar a modo oscuro', exact: true }),
  ).toBeVisible();
});
test('quick theme does not overwrite other pending settings or revert when saving', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/settings');
  await page.getByLabel('Duración de sesión', { exact: true }).selectOption('15');
  await page.getByRole('button', { name: 'Cambiar a modo oscuro', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByLabel('Tema', { exact: true })).toHaveValue('dark');
  await expect(page.getByLabel('Duración de sesión', { exact: true })).toHaveValue('15');
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByLabel('Duración de sesión', { exact: true })).toHaveValue('15');
});
