import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('relations select families, partial selection combines with other filters and none gives no results', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByText('Relación y familias', { exact: true }).click();
  const scope = page.getByRole('group', { name: 'Relación de formas y familias', exact: true });
  const relation = scope.getByRole('group', { name: 'Relación de formas', exact: true });
  const all = scope.getByRole('checkbox', { name: 'Todas las familias', exact: true });
  await relation.getByRole('radio', { name: 'AAA · Tres iguales', exact: true }).check();
  await expect(all).toBeChecked();
  await expect(scope.getByText('2 de 2 familias seleccionadas', { exact: true })).toBeVisible();
  await scope
    .getByRole('checkbox', { name: 'AAA · Misma escritura, cambia la vocal (read)', exact: true })
    .uncheck();
  await expect(all).toBeChecked({ indeterminate: true });
  await expect(page.getByRole('link', { name: 'Ver ficha de read', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ver ficha de put', exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Buscar verbos' }).fill('put');
  await expect(page.getByRole('link', { name: 'Ver ficha de put', exact: true })).toBeVisible();
  await all.check();
  await expect(all).toBeChecked();
  await all.uncheck();
  await expect(page.getByRole('heading', { name: 'No hay coincidencias' })).toBeVisible();
  await expect(scope.getByText('0 de 2 familias seleccionadas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Quitar filtro de familias', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Buscar verbos' })).toHaveValue('put');
  await expect(
    relation.getByRole('radio', { name: 'AAA · Tres iguales', exact: true }),
  ).toBeChecked();
  await expect(all).toBeChecked();
  await relation.getByRole('radio', { name: 'ABC · Tres diferentes', exact: true }).check();
  await expect(all).toBeChecked();
  await page.getByRole('searchbox', { name: 'Buscar verbos' }).fill('');
  await expect(page.getByRole('link', { name: 'Ver ficha de sing', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click();
  await expect(
    relation.getByRole('radio', { name: 'Todas las relaciones', exact: true }),
  ).toBeChecked();
  await expect(page.getByRole('link', { name: 'Ver ficha de read', exact: true })).toBeVisible();
});
