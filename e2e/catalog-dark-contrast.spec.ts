import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('catalogue accents and audio stay readable in explicit and automatic dark themes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const theme of ['dark', 'system']) {
    await page.goto('/settings');
    await page.getByLabel('Tema', { exact: true }).selectOption(theme);
    await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
    await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
    await page.goto('/verbs');
    await page.getByLabel('Buscar verbos', { exact: true }).fill('put');
    await page.getByRole('button', { name: 'Vista detallada', exact: true }).click();
    await page.getByRole('button', { name: 'Filtros', exact: true }).click();
    await page.getByRole('radio', { name: '1.º ESO', exact: true }).check();
    await page.getByRole('radio', { name: 'Esencial', exact: true }).check();
    await page.getByText('Relación y familias', { exact: true }).click();
    await page.getByRole('radio', { name: 'AAA · Tres iguales', exact: true }).check();
    await page.getByRole('button', { name: 'Cerrar filtros', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Seleccionar put', exact: true }).check();
    await page.screenshot({ animations: 'disabled' });
    for (const [selector, token] of [
      ['.cq-active-filters .cq-course', '--cq-teal'],
      ['.cq-active-filters .cq-frequency', '--cq-gold'],
      ['.cq-active-filters .cq-pattern', '--cq-purple'],
      ['button.cq-sound', '--blue'],
      ['.cq-actions button.cq-action', '--muted'],
      ['.result-bottom button', '--button-text'],
    ]) {
      const colours = await page
        .locator(selector)
        .first()
        .evaluate((element, variable) => {
          const probe = document.createElement('span');
          probe.style.color = `var(${variable})`;
          element.append(probe);
          const expected = getComputedStyle(probe).color;
          probe.remove();
          return { actual: getComputedStyle(element).color, expected };
        }, token);
      expect(colours.actual, `${theme}: ${selector}`).toBe(colours.expected);
    }
    const result = await new AxeBuilder({ page })
      .include('.catalog-page')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});
