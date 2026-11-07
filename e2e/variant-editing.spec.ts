import { test, expect } from '@playwright/test';
test('retyping a variant preserves its original dialect IPA translation and learning identity', async ({
  page,
}) => {
  await page.goto('/editor/verbs/get');
  await page.getByRole('button', { name: 'Formas y sonidos', exact: true }).click();
  const input = page.getByRole('textbox', {
    name: 'Participio pasado (variantes separadas por /)',
    exact: true,
  });
  await expect(input).toHaveValue('got / gotten');
  await input.focus();
  await input.press('End');
  await input.press('Backspace');
  await input.press('n');
  await expect(input).toHaveValue('got / gotten');
  await expect(
    page.getByRole('textbox', { name: 'Traducción de gotten (participio)', exact: true }),
  ).toHaveValue('conseguido / obtenido');
  await expect(page.getByRole('button', { name: 'Guardar verbo', exact: true })).toBeDisabled();
  await page
    .getByLabel('Notas generales de participio pasado', { exact: true })
    .fill('Revisión de variantes');
  await page.getByRole('button', { name: 'Guardar verbo', exact: true }).click();
  await expect(page).toHaveURL(/\/verbs\/get$/);
  await expect(page.locator('.form-card').nth(2)).toContainText('/ˈɡɑːtn/');
  await expect(page.locator('.form-card').nth(2)).toContainText('conseguido / obtenido');
  await expect(page.locator('.form-card').nth(2)).toContainText('Obtener, inglés americano');
});
