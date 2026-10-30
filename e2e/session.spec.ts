import { test, expect } from '@playwright/test';
test('quiz answer persists through reload without improving spelling', async ({ page }) => {
  await page.goto('/games');
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Quiz de verbos' }) })
    .getByRole('button', { name: 'Jugar ahora' })
    .click();
  await expect(page.getByRole('heading', { name: 'Quiz', exact: true })).toBeVisible();
  const options = page.locator('.answer-options button');
  await options.first().click();
  await expect(page.getByRole('button', { name: 'Siguiente pregunta' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.session-card')).toBeVisible();
  await page.getByRole('button', { name: 'Terminar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lo de hoy ya cuenta.' })).toBeVisible();
});
test('flashcards reveal before self-rating', async ({ page }) => {
  await page.goto('/games');
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Flashcards' }) })
    .getByRole('button', { name: 'Jugar ahora' })
    .click();
  await page.getByRole('button', { name: 'Revelar respuesta' }).click();
  await page.getByRole('button', { name: 'Dudé', exact: true }).click();
  await expect(page.getByText('Valoración guardada')).toBeVisible();
});

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    try {
      const marks = await page.evaluate(() =>
        performance.getEntriesByType('mark').map((e) => ({ name: e.name, time: e.startTime })),
      );
      await info.attach('boot-marks', {
        body: JSON.stringify(marks),
        contentType: 'application/json',
      });
    } catch {}
  }
});
