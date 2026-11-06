import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('catalogue defaults to genuinely compact rows with icons and a bounded collapsible filter panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/verbs');
  await expect(page.getByRole('button', { name: 'Vista compacta', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const rows = page.locator('.catalog-item-compact');
  await expect(rows).toHaveCount(120);
  expect(await rows.first().evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(150);
  await expect(page.locator('.catalog-page .cq-verb-icon').first()).not.toHaveText('✦');
  await expect(rows.locator('.cq-label-badge')).toHaveCount(0);
  await expect(rows.locator('.cq-sound')).toHaveCount(0);
  const filters = page.getByRole('button', { name: 'Filtros', exact: true });
  await filters.click();
  await expect(filters).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('checkbox', { name: 'Ver archivados', exact: true })).toBeVisible();
  expect(
    await page.locator('.cq-filter-scroll').evaluate((el) => el.getBoundingClientRect().height),
  ).toBeLessThan(500);
  await page.getByRole('button', { name: 'Cerrar filtros', exact: true }).click();
  await expect(filters).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#catalog-filters')).toHaveCount(0);
  await page.getByLabel('Buscar verbos').fill('went');
  await page.getByRole('button', { name: 'Vista detallada', exact: true }).click();
  const card = page.locator('.catalog-item-expanded');
  await expect(card).toHaveCount(1);
  await expect(card.locator('.cq-forms-grid')).toContainText('went');
  await expect(card.locator('.cq-forms-grid')).not.toContainText('IPA');
  await page.getByLabel('Buscar verbos').fill('were');
  await expect(card.getByText('I/he/she/it en pasado indicativo', { exact: true })).toBeVisible();
  await expect(card.getByText('you/we/they en pasado indicativo', { exact: true })).toBeVisible();
  const forms = await card.locator('.cq-forms-grid').boundingBox();
  const actions = await card.locator('.cq-card-footer').boundingBox();
  expect(actions!.y).toBeGreaterThanOrEqual(forms!.y + forms!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('catalogue actions stay outside conjugations at narrow and wide widths in both modes', async ({
  page,
}) => {
  await page.goto('/verbs');
  await page.getByLabel('Buscar verbos').fill('went');
  await page.getByRole('switch', { name: 'Modo de edición del catálogo' }).check();
  for (const width of [320, 600, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ['compacta', 'detallada']) {
      await page.getByRole('button', { name: `Vista ${mode}`, exact: true }).click();
      const card = page.locator('.cq-card');
      const forms = await card
        .locator(mode === 'compacta' ? '.cq-forms-strip' : '.cq-forms-grid')
        .boundingBox();
      const actions = await card.locator('.cq-actions').boundingBox();
      expect(forms && actions).toBeTruthy();
      const overlap =
        forms!.x < actions!.x + actions!.width &&
        actions!.x < forms!.x + forms!.width &&
        forms!.y < actions!.y + actions!.height &&
        actions!.y < forms!.y + forms!.height;
      expect(overlap, `${width}px ${mode}: actions overlap conjugations`).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.getByRole('link', { name: 'Editar go', exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Escuchar las tres formas de go', exact: true }),
      ).toBeVisible();
    }
  }
});
