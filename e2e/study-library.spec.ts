import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('Study exposes prepared plans with scope, empty states and direct context practice', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/study');
  await expect(page.getByRole('heading', { name: 'Planes preparados', exact: true })).toBeVisible();
  await expect(page.locator('.sp-plan-card')).toHaveCount(10);
  await expect(
    page.getByRole('button', { name: 'Empezar Mis verbos difíciles', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Empezar Preparación de examen', exact: true }),
  ).toBeDisabled();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({ animations: 'disabled' });
  expect((await new AxeBuilder({ page }).include('.study-page').analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Empezar Verbos en contexto', exact: true }).click();
  await expect(page.locator('.session-card')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Completa la frase', exact: true })).toBeVisible();
  const prompt = await page.locator('.question-prompt').innerText();
  await page.reload();
  await expect(page.locator('.question-prompt')).toHaveText(prompt);
  await expect(page.locator('.sp-plan-library')).toHaveCount(0);
});
test('exam quick start requires a list and does not add an unsolicited personal plan', async ({
  page,
}) => {
  await page.goto('/verbs');
  await page.getByRole('checkbox', { name: 'Seleccionar go', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar en lista', exact: true }).click();
  await page.getByLabel('Nombre de la lista', { exact: true }).fill('Mi examen');
  await page.getByRole('button', { name: 'Guardar lista', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mi examen 1', exact: true })).toBeVisible();
  await page.goto('/study');
  await page
    .getByRole('combobox', { name: 'Lista para Preparación de examen', exact: true })
    .selectOption({ label: 'Mi examen' });
  await expect(page.locator('#template-exam .sp-selection-summary')).toContainText(
    '1 verbo en la selección',
  );
  await page.getByRole('button', { name: 'Empezar Preparación de examen', exact: true }).click();
  await expect(page.locator('.session-card')).toBeVisible();
  await page.getByRole('button', { name: 'Terminar sesión', exact: true }).click();
  await page.waitForURL(/summary=/);
  await page.goto('/study');
  await expect(page.locator('.sp-personal-empty')).toBeVisible();
});
test('customizing pattern frequency keeps the family and leaves the prepared plan intact', async ({
  page,
}) => {
  await page.goto('/study');
  await expect(page.locator('#template-patterns .sp-selection-summary strong')).toHaveText('5');
  await page
    .getByRole('link', { name: 'Personalizar Patrones y terminaciones', exact: true })
    .click();
  await expect(page.getByRole('combobox', { name: 'Familia de formas', exact: true })).toHaveValue(
    'ought',
  );
  await page.getByRole('combobox', { name: 'Frecuencia', exact: true }).selectOption('common');
  await expect(page.getByRole('combobox', { name: 'Familia de formas', exact: true })).toHaveValue(
    'ought',
  );
  await page.getByLabel('Nombre del plan', { exact: true }).fill('Mi familia ought');
  await page.getByRole('button', { name: 'Guardar y preparar sesión', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Tu próxima sesión' })).toContainText(
    'Mi familia ought',
  );
  await expect(page.getByRole('article', { name: 'Mi familia ought', exact: true })).toBeVisible();
  await expect(page.locator('#template-patterns .sp-selection-summary strong')).toHaveText('5');
  await page.getByRole('button', { name: 'Comenzar sesión', exact: true }).click();
  await expect(page.locator('.session-card')).toBeVisible();
});
