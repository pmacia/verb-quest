import { test, expect } from '@playwright/test';
test('phonetic transcriptions stay visible independently of strict filtering and review messages', async ({
  page,
}) => {
  await page.goto('/verbs/read');
  await expect(page.locator('.form-card').nth(0)).toContainText('/riːd/');
  await expect(page.locator('.form-card').nth(1)).toContainText('/red/');
  await expect(page.locator('.form-card').nth(2)).toContainText('/red/');
  await expect(page.getByRole('heading', { name: 'Fuentes y revisión', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole('heading', { name: 'Revisión IPA', exact: true })).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('Transcripciones contrastadas');
  await expect(page.locator('.example').first()).not.toContainText('revisión asistida');
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Modo IPA estricto', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.goto('/verbs/read');
  await expect(page.locator('.form-card').nth(0)).toContainText('/riːd/');
  await expect(page.locator('.form-card').nth(1)).toContainText('/red/');
  await expect(page.locator('main')).not.toContainText('Transcripciones contrastadas');
  await expect(page.getByRole('heading', { name: 'Revisión IPA', exact: true })).toHaveCount(0);
});
