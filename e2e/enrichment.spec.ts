import { test, expect } from '@playwright/test';
test('enriched patterns and topics filter the existing library with Spanish labels', async ({
  page,
}) => {
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Todas las familias', exact: true }).uncheck();
  await page
    .getByRole('checkbox', { name: 'ABC · Alternancia escrita i–a–u', exact: true })
    .check();
  await expect(page.getByRole('link', { name: /^sing\s/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^buy\s/ })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Tema', exact: true }).selectOption('communication');
  await expect(page.getByRole('link', { name: /^sing\s/ })).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Tema', exact: true }).locator('option:checked'),
  ).toHaveText('Comunicación');
  await page.getByRole('button', { name: 'Quitar filtro de familias', exact: true }).click();
  await page.getByRole('combobox', { name: 'Tema', exact: true }).selectOption('');
  await page
    .getByRole('combobox', { name: 'Forma del filtro fonético', exact: true })
    .selectOption('pastSimple');
  await page
    .getByRole('combobox', { name: 'Dialecto del filtro fonético', exact: true })
    .selectOption('us');
  await page.getByLabel('Sonido final', { exact: true }).fill('t');
  await expect(page.getByRole('link', { name: /^go\s/ })).toBeVisible();
  await page.getByLabel('Sonido final', { exact: true }).fill('');
  await expect(
    page.getByRole('combobox', { name: 'Forma del filtro fonético', exact: true }),
  ).toHaveValue('pastSimple');
  await expect(
    page.getByRole('combobox', { name: 'Dialecto del filtro fonético', exact: true }),
  ).toHaveValue('us');
});
test('pronunciation distinguishes reviewed UK/US forms from pending proposals', async ({
  page,
}) => {
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Modo IPA estricto' }).check();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.goto('/verbs/go');
  await expect(page.getByText('go · IPA UK: /ɡəʊ/', { exact: true })).toBeVisible();
  await expect(page.getByText('gone · IPA US: /ɡɑːn/', { exact: true })).toBeVisible();
  await page.goto('/verbs/write');
  await expect(
    page.getByText('IPA propuesta · pendiente de revisión', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('write · IPA UK: /raɪt/', { exact: true })).toHaveCount(0);
});
