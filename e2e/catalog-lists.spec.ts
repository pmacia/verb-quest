import { test, expect } from '@playwright/test';

test('saved lists can be filtered, renamed and deleted without removing verbs', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/verbs');
  await page.getByRole('checkbox', { name: 'Seleccionar go', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar en lista', exact: true }).click();
  await page.getByLabel('Nombre de la lista', { exact: true }).fill('Mi examen');
  await page.getByRole('button', { name: 'Guardar lista', exact: true }).click();
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  const listGroup = page
    .locator('details')
    .filter({ has: page.locator('summary', { hasText: /^Lista$/ }) });
  await expect(listGroup).not.toHaveAttribute('open');
  await listGroup.locator('summary').click();
  await page
    .getByRole('combobox', { name: 'Filtrar por lista', exact: true })
    .selectOption({ label: 'Mi examen' });
  await expect(page.locator('.cq-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Mi examen 1', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Renombrar lista Mi examen', exact: true }).click();
  await page.getByLabel('Nombre de la lista', { exact: true }).fill('Examen del viernes');
  await page.getByRole('button', { name: 'Guardar nombre', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Examen del viernes 1', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: /Quitar lista: Examen del viernes/ }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Eliminar lista Examen del viernes', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Eliminar lista', exact: true });
  await expect(dialog).toContainText('Los verbos no se eliminarán');
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('.cq-card')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Eliminar lista Examen del viernes', exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Eliminar lista', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Filtrar por lista', exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator('.cq-card')).toHaveCount(120);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Examen del viernes 1', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole('checkbox', { name: 'Seleccionar go', exact: true })).toBeVisible();
});
