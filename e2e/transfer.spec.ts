import { test, expect } from '@playwright/test';
test('import preview requires explicit conflict decision', async ({ page }) => {
  await page.goto('/editor/import-export');
  await page
    .getByLabel('Archivo del catálogo')
    .setInputFiles({
      name: 'verbs.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('id,base,past_simple,past_participle,meanings_es\ngo,go,went,gone,ir'),
    });
  await expect(page.getByText('Identificador existente (go)', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Revisar importación' })).toBeDisabled();
  await page.getByLabel('Decisión para fila 2').selectOption('skip');
  await page.getByRole('button', { name: 'Revisar importación' }).click();
  await page.getByRole('button', { name: 'Confirmar y guardar' }).click();
  await expect(page.getByRole('status')).toHaveText('0 entradas importadas; 1 omitidas.');
});
