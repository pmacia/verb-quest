import { test, expect } from '@playwright/test';
test('HTTP network origin can create a profile, list, plan and recover a session', async ({
  page,
  baseURL,
}) => {
  // Route assets locally while the browser uses a genuine non-trustworthy HTTP origin.
  // This reproduces LAN HTTP restrictions without DNS or a machine-specific IP.
  const origin = 'http://verbquest.test';
  await page.route(origin + '/**', async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: baseURL + url.pathname + url.search,
      headers: { ...route.request().headers(), host: new URL(baseURL!).host },
    });
    await route.fulfill({ response });
  });
  await page.goto(origin + '/verbs');
  expect(
    await page.evaluate(() => ({
      secure: isSecureContext,
      uuid: typeof crypto.randomUUID,
      entropy: typeof crypto.getRandomValues,
    })),
  ).toEqual({ secure: false, uuid: 'undefined', entropy: 'function' });
  await expect(page.getByRole('textbox', { name: 'Buscar verbos' })).toBeVisible();
  for (const id of ['be', 'go', 'take'])
    await page.getByRole('checkbox', { name: 'Seleccionar ' + id, exact: true }).check();
  await page.getByRole('button', { name: 'Guardar selección' }).click();
  await page.getByLabel('Nombre de la lista').fill('Lista HTTP');
  await page.getByRole('button', { name: 'Guardar lista', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lista HTTP 3', exact: true })).toBeVisible();
  await page.goto(origin + '/plans/template-zero');
  await page.getByLabel('Nombre del plan').fill('Plan HTTP');
  await page.getByRole('button', { name: 'Guardar y preparar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Plan HTTP', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Comenzar sesión' }).click();
  await expect(page.locator('.question-prompt')).toBeVisible();
  await page.reload();
  await expect(page.locator('.question-prompt')).toBeVisible();
  await page.getByRole('button', { name: 'Terminar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lo de hoy ya cuenta.' })).toBeVisible();
});
