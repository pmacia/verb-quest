import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function preparePlan(page: Page, name: string) {
  await page.goto('/plans/template-zero');
  await page.getByLabel('Nombre del plan', { exact: true }).fill(name);
  await page.getByLabel('Origen de los verbos').selectOption('manual');
  await page.getByLabel('go · ir', { exact: true }).check();
  await page.getByLabel('Reconocer formas', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Guardar y preparar sesión' }).click();
  await expect(page.getByRole('region', { name: 'Tu próxima sesión' })).toContainText(name);
  return page.url();
}
async function sessions(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('verbquest');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const rows = await new Promise<
      Array<{
        status: string;
        planId: string | null;
        planContext?: { id: string; listId?: string };
        attemptIds: string[];
        queue: Array<{ verbId: string }>;
      }>
    >((resolve, reject) => {
      const req = db.transaction('sessions').objectStore('sessions').getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rows;
  });
}
test('Home remembers completed plans and Study continues the right plan without resetting progress', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const otherUrl = await preparePlan(page, 'A Otro plan');
  await preparePlan(page, 'Z Mi plan');
  await page.getByRole('button', { name: 'Comenzar sesión', exact: true }).click();
  await page.getByRole('button', { name: 'Revelar respuesta' }).click();
  await page.getByRole('button', { name: 'Lo sabía', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Valoración guardada' })).toBeVisible();
  await page.getByRole('button', { name: 'Terminar sesión', exact: true }).click();
  await page.waitForURL(/summary=/);
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Tu próxima aventura' });
  await expect(hero).toContainText('Z Mi plan');
  await expect(
    hero.getByRole('link', { name: 'Continuar con mi plan', exact: true }),
  ).toBeVisible();
  const recent = page.getByRole('region', { name: 'Planes recientes' });
  await expect(recent.getByRole('heading', { name: 'Z Mi plan', exact: true })).toBeVisible();
  await expect(recent).toContainText('1 de 1 verbos practicados');
  await page.reload();
  await hero.getByRole('link', { name: 'Continuar con mi plan', exact: true }).click();
  const next = page.getByRole('region', { name: 'Tu próxima sesión' });
  await expect(next).toContainText('Z Mi plan');
  await expect(next).toContainText('Tu progreso se conserva');
  await expect(
    page.getByRole('button', { name: 'Continuar Z Mi plan', exact: true }),
  ).toBeVisible();
  await page.goto(otherUrl);
  await expect(next).toContainText('A Otro plan');
  await page.goto('/study');
  await expect(next).toContainText('Z Mi plan');
  await page.getByRole('button', { name: 'Comenzar sesión', exact: true }).click();
  const rows = await sessions(page);
  expect(rows).toHaveLength(2);
  expect(rows.reduce((n, s) => n + s.attemptIds.length, 0)).toBe(1);
  expect(rows[0].planId).toBe(rows[1].planId);
  await page.goto('/');
  await expect(hero.getByRole('link', { name: 'Continuar mi sesión', exact: true })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Continuar con mi plan', exact: true })).toHaveCount(
    0,
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
  await page.screenshot({ animations: 'disabled' });
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
});
test('a recent exam returns to its own saved list rather than another list', async ({ page }) => {
  for (const [verb, name] of [
    ['go', 'Mi examen'],
    ['take', 'Otra lista'],
  ]) {
    await page.goto('/verbs');
    await page.getByRole('checkbox', { name: `Seleccionar ${verb}`, exact: true }).check();
    await page.getByRole('button', { name: 'Guardar en lista', exact: true }).click();
    await page.getByLabel('Nombre de la lista', { exact: true }).fill(name);
    await page.getByRole('button', { name: 'Guardar lista', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Guardar lista' })).toHaveCount(0);
  }
  await page.goto('/study');
  await page
    .getByRole('combobox', { name: 'Lista para Preparación de examen', exact: true })
    .selectOption({ label: 'Mi examen' });
  await page.getByRole('button', { name: 'Empezar Preparación de examen', exact: true }).click();
  await expect(page.locator('.question-prompt')).toBeVisible();
  await page.getByRole('button', { name: 'Terminar sesión', exact: true }).click();
  await page.waitForURL(/summary=/);
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Tu próxima aventura' });
  await expect(hero).toContainText('Mi examen');
  await hero.getByRole('link', { name: 'Continuar con mi plan', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Tu próxima sesión' })).toContainText('Mi examen');
  await page.getByRole('button', { name: 'Comenzar sesión', exact: true }).click();
  const rows = await sessions(page);
  const active = rows.find((s) => s.status !== 'completed')!;
  expect(active.planContext?.listId).toBe(
    rows.find((s) => s.status === 'completed')?.planContext?.listId,
  );
  expect(active.queue.every((q) => q.verbId === 'go')).toBe(true);
});
