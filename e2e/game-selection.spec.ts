import { test, expect } from '@playwright/test';
test('games can use an existing plan or a manual verb selection', async ({ page }) => {
  await page.goto('/plans/template-eso1');
  await page.getByLabel('Nombre del plan').fill('Plan para juegos');
  await page.getByRole('button', { name: 'Guardar y preparar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Plan para juegos', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Juegos', exact: true }).click();
  await page.getByLabel('Selección de verbos').selectOption({ label: 'Plan · Plan para juegos' });
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Quiz de verbos' }) })
    .getByRole('button', { name: 'Jugar ahora' })
    .click();
  await expect(page.locator('.question-prompt')).toBeVisible();
  await page.getByRole('button', { name: 'Terminar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lo de hoy ya cuenta.' })).toBeVisible();
  await page.goto('/games');
  await page.getByLabel('Selección de verbos').selectOption('manual');
  for (const label of ['go · ir', 'buy · comprar', 'take · tomar'])
    await page.getByLabel(label, { exact: true }).check();
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Quiz de verbos' }) })
    .getByRole('button', { name: 'Jugar ahora' })
    .click();
  await expect(page.locator('.question-prompt')).toBeVisible();
});

test('matching associates all three forms before checking', async ({ page }) => {
  await page.goto('/games');
  await page.getByLabel('Selección de verbos').selectOption('manual');
  await page.getByLabel('go · ir', { exact: true }).check();
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Emparejar formas' }) })
    .getByRole('button', { name: 'Jugar ahora' })
    .click();
  const clues = page.getByRole('group', { name: 'Pistas para emparejar' });
  const forms = page.getByRole('group', { name: 'Formas para emparejar' });
  await expect(page.getByRole('button', { name: 'Comprobar parejas' })).toBeDisabled();
  for (const [clue, form] of [
    ['Forma base · ir', 'go'],
    ['pasado simple', 'went'],
    ['participio pasado', 'gone'],
  ]) {
    await clues.getByRole('button', { name: clue, exact: true }).click();
    await forms.getByRole('button', { name: form, exact: true }).press('Enter');
  }
  await page.getByRole('button', { name: 'Comprobar parejas' }).click();
  await expect(page.getByRole('heading', { name: '¡Bien recordado!' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver resumen' }).click();
  await expect(page.getByRole('heading', { name: 'Lo de hoy ya cuenta.' })).toBeVisible();
});
