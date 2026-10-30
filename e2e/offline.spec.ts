import { test, expect } from '@playwright/test';
test('first complete load makes direct verb route available offline', async ({ page, context }) => {
  await page.goto('/verbs');
  await expect(page.getByRole('textbox', { name: 'Buscar verbos' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker?.controller), { timeout: 5000 })
    .toBe(true);
  await context.setOffline(true);
  await page.goto('/verbs/go');
  await expect(page.getByRole('heading', { name: 'go.', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'go.', exact: true })).toBeVisible();
  await context.setOffline(false);
});
