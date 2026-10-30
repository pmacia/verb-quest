import { test, expect } from '@playwright/test';
test('new verb persists and dirty edits require confirmation', async ({ page }) => {
  await page.goto('/editor/verbs/new');
  await page.getByLabel('Identificador estable').fill('babysit');
  await page.getByLabel('Forma base', { exact: true }).fill('babysit');
  await page.getByLabel('Pasado simple (variantes separadas por /)').fill('babysat');
  await page.getByLabel('Participio pasado (variantes separadas por /)').fill('babysat');
  await page.getByLabel('Significados (separados por ;)').fill('cuidar niños');
  await page.getByRole('button', { name: 'Guardar verbo' }).click();
  await expect(page.getByRole('heading', { name: 'babysit.', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: 'Editar ficha' }).click();
  await page.getByLabel('Forma base', { exact: true }).fill('babysit-change');
  await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeVisible();
  await page.getByRole('button', { name: 'Salir sin guardar' }).click();
  await expect(page.getByRole('link', { name: /^babysit/ })).toBeVisible();
});

test('archived verbs can be found and restored from the library', async ({ page }) => {
  await page.goto('/editor/verbs/go');
  await page.getByRole('button', { name: 'Archivar verbo', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar archivo' }).click();
  await expect(page.getByText('Este verbo está archivado.', { exact: false })).toBeVisible();
  await page.goto('/verbs');
  await page.getByLabel('Ver archivados', { exact: true }).check();
  await page.getByRole('link', { name: 'Ver ficha de go' }).click();
  await page.getByRole('link', { name: 'Editar ficha' }).click();
  await page.getByRole('button', { name: 'Restaurar verbo' }).click();
  await expect(page.getByText('Este verbo está archivado.', { exact: false })).toHaveCount(0);
});

test('advanced JSON cannot replace the form with malformed data', async ({ page }) => {
  await page.goto('/editor/verbs/go');
  await page
    .getByText('Todos los campos: ejemplos, IPA, audio, fuentes y etiquetas', { exact: true })
    .click();
  await page.getByLabel('Datos completos de la ficha').fill('{"id":"go"}');
  await page.getByRole('button', { name: 'Aplicar JSON al formulario' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('Forma base', { exact: true })).toHaveValue('go');
});
