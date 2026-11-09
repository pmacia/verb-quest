import { test, expect } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`shared close control stays circular and unfilled in ${colorScheme} dialogs`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/verbs');
    await page.getByRole('checkbox', { name: 'Seleccionar go', exact: true }).check();
    const trigger = page.getByRole('button', { name: 'Guardar en lista', exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Guardar lista', exact: true });
    const close = dialog.getByRole('button', { name: 'Cerrar', exact: true });
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const box = await close.boundingBox();
      expect(box!.width).toBe(32);
      expect(box!.height).toBe(32);
      await expect(close.locator('svg')).toBeVisible();
      await close.hover();
      await page.screenshot({ animations: 'disabled' });
      expect(await close.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
        'rgba(0, 0, 0, 0)',
      );
    }
    await close.click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Guardar en lista', exact: true })).toBeFocused();
  });
}
