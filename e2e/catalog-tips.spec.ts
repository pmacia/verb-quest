import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`catalogue tips wrap in both directions and vary between visits at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/verbs');
    const tips = page.getByRole('region', { name: 'Consejos del catálogo' });
    const title = tips.getByRole('heading');
    await expect(title).toHaveText('Busca más allá del infinitivo');
    await tips.getByRole('button', { name: 'Consejo anterior' }).click();
    await expect(title).toHaveText('Una misma escritura, dos sonidos');
    await tips.getByRole('button', { name: 'Consejo siguiente' }).click();
    await expect(title).toHaveText('Busca más allá del infinitivo');
    const titles = new Set<string>();
    for (let i = 0; i < 7; i++) {
      titles.add((await title.textContent())!);
      await tips.getByRole('button', { name: 'Consejo siguiente' }).click();
    }
    expect(titles.size).toBe(7);
    await expect(title).toHaveText('Busca más allá del infinitivo');
    await page.reload();
    await expect(title).toHaveText('Escucha las tres formas');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
