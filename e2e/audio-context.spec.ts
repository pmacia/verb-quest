import { test, expect } from '@playwright/test';
test('unavailable audio continues visually without listening evidence', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }),
  );
  await page.goto('/games');
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Audio Detective' }) })
    .getByRole('button', { name: 'Jugar ahora' })
    .click();
  await page.getByRole('button', { name: 'No puedo usar audio · alternativa visual' }).click();
  await expect(
    page.getByText('Esta respuesta no contará como escucha.', { exact: false }),
  ).toBeVisible();
  await page.getByLabel('Tu respuesta').fill('wrong');
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Vamos a darle otra vuelta' })).toBeVisible();
  await page.getByRole('button', { name: 'Terminar sesión', exact: true }).click();
  await page.getByRole('link', { name: 'Ver mi progreso', exact: true }).click();
  await expect(page.getByText('Escritura', { exact: true }).first()).toBeVisible();
});
