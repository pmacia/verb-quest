import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const route of ['/', '/verbs', '/verbs/go', '/plans', '/games', '/progress', '/settings'])
  test('accessible main flow ' + route, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole('main')).toBeVisible();
    await page.getByRole('heading', { level: 1 }).waitFor();
    const report = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(report.violations).toEqual([]);
  });
