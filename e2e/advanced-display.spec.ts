import { test, expect } from '@playwright/test';
test('advanced information defaults hidden and sources can be enabled without IPA then hidden again', async ({
  page,
}) => {
  await page.goto('/verbs/go');
  await expect(page.getByRole('heading', { name: 'Fuentes y revisión', exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator('.example').first()).not.toContainText('revisión asistida');
  await expect(page.locator('.example').first().getByRole('heading')).toBeVisible();
  await page.goto('/settings');
  const section = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Información avanzada', exact: true }) });
  await expect(
    section.getByRole('switch', { name: 'Modo IPA estricto', exact: true }),
  ).not.toBeChecked();
  await expect(
    section.getByRole('switch', { name: 'Mostrar fuentes y revisión', exact: true }),
  ).not.toBeChecked();
  await expect(
    section.getByRole('switch', { name: 'Mostrar detalles técnicos del audio', exact: true }),
  ).not.toBeChecked();
  await section.getByRole('switch', { name: 'Mostrar fuentes y revisión', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.goto('/verbs/go');
  await expect(
    page.getByRole('heading', { name: 'Fuentes y revisión', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.example').first()).toContainText('revisión asistida');
  await expect(page.locator('.form-card').first()).toContainText('/ɡəʊ/');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Fuentes y revisión', exact: true }),
  ).toBeVisible();
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Mostrar fuentes y revisión', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.goto('/verbs/go');
  await expect(page.getByRole('heading', { name: 'Fuentes y revisión', exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator('.example').first()).not.toContainText('revisión asistida');
});
