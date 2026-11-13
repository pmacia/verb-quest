import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function seedEvidence(page: Page) {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('verbquest');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const profile = await new Promise<{ id: string }>((resolve, reject) => {
      const request = db.transaction('profiles').objectStore('profiles').getAll();
      request.onsuccess = () => resolve(request.result[0]);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('progress', 'readwrite');
      const base = {
        profileId: profile.id,
        state: 'learning',
        stage: 0,
        dueDate: null,
        lastAdvanceDate: null,
        eligibleDates: [],
        coverage: [],
        hasWrittenContextEvidence: false,
        objectiveError: false,
        selfReportReview: false,
        started: true,
      };
      tx.objectStore('progress').put({
        ...base,
        verbId: 'go',
        skill: 'recall',
        state: 'mastered',
        stage: 4,
      });
      tx.objectStore('progress').put({
        ...base,
        verbId: 'go',
        skill: 'spelling',
        objectiveError: true,
      });
      tx.objectStore('progress').put({
        ...base,
        verbId: 'take',
        skill: 'recall',
        selfReportReview: true,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
}
test('quick indicators open practiced verbs and specific pending skills', async ({ page }) => {
  await page.goto('/progress');
  await expect(page.getByRole('combobox', { name: 'Progreso de', exact: true })).toBeVisible();
  await seedEvidence(page);
  await page.goto('/');
  const practiced = page.locator('.progress-stat-link').filter({ hasText: 'Verbos practicados' });
  await expect(practiced).toContainText('2');
  await practiced.click();
  await expect(page.getByRole('combobox', { name: 'Mostrar', exact: true })).toHaveValue(
    'practiced',
  );
  const details = page.getByRole('region', { name: 'Detalle del progreso' });
  await expect(details.locator('article')).toHaveCount(2);
  await expect(details.getByRole('link', { name: 'go', exact: true })).toBeVisible();
  await expect(details.getByRole('link', { name: 'take', exact: true })).toBeVisible();
  await page.locator('.progress-stat-link').filter({ hasText: 'Repasos pendientes' }).click();
  await expect(page.getByRole('combobox', { name: 'Mostrar', exact: true })).toHaveValue('due');
  const reviewPanel = details.locator('details');
  await expect(reviewPanel).not.toHaveAttribute('open');
  await expect(details.getByRole('link', { name: 'go', exact: true })).toBeHidden();
  await reviewPanel.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(reviewPanel).toHaveAttribute('open');
  await expect(details.getByRole('link', { name: 'go', exact: true })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(reviewPanel).not.toHaveAttribute('open');
  await reviewPanel.locator('summary').click();
  await expect(reviewPanel).toHaveAttribute('open');
  await expect(details.locator('.skill-row')).toHaveCount(2);
  await expect(
    details.locator('article').filter({ has: page.getByRole('link', { name: 'go', exact: true }) }),
  ).toContainText('Escritura');
  await expect(
    details.locator('article').filter({ has: page.getByRole('link', { name: 'go', exact: true }) }),
  ).not.toContainText('Memoria');
  await expect(
    page.getByRole('progressbar', { name: 'Dominio de Memoria', exact: true }),
  ).toHaveAttribute('value', '1');
  await expect(
    page.getByRole('progressbar', { name: 'Dominio de Memoria', exact: true }),
  ).toHaveAttribute('max', '120');
});
test('plan charts use the full scope and keep it when opening pending reviews', async ({
  page,
}) => {
  await page.goto('/plans/new');
  await page.getByLabel('Nombre del plan').fill('Mi plan de progreso');
  await page.getByLabel('Origen de los verbos').selectOption('manual');
  for (const verb of ['go · ir', 'buy · comprar'])
    await page.getByLabel(verb, { exact: true }).check();
  await page.getByLabel('Verbos nuevos por sesión').fill('1');
  await page.getByRole('button', { name: 'Guardar y preparar sesión' }).click();
  await page.getByRole('button', { name: 'Comenzar sesión' }).click();
  await expect(page.locator('.question-prompt')).toBeVisible();
  await seedEvidence(page);
  await page.goto('/progress');
  await page.getByRole('combobox', { name: 'Progreso de', exact: true }).selectOption('current');
  await expect(page.getByRole('region', { name: 'Ámbito del progreso' })).toContainText(
    'Mi plan de progreso',
  );
  const memory = page.getByRole('progressbar', { name: 'Dominio de Memoria', exact: true });
  await expect(memory).toHaveAttribute('value', '1');
  await expect(memory).toHaveAttribute('max', '2');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Progreso de', exact: true })).toHaveValue(
    'current',
  );
  await expect(memory).toHaveAttribute('max', '2');
  await page.locator('.progress-stat-link').filter({ hasText: 'Repasos pendientes' }).click();
  await expect(page.getByRole('combobox', { name: 'Mostrar', exact: true })).toHaveValue('due');
  const details = page.getByRole('region', { name: 'Detalle del progreso' });
  await expect(details.locator('details')).not.toHaveAttribute('open');
  await details.locator('summary').click();
  await expect(details.locator('article')).toHaveCount(1);
  await expect(details.getByRole('link', { name: 'go', exact: true })).toBeVisible();
  await expect(details.getByRole('link', { name: 'take', exact: true })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Progreso de', exact: true })).toHaveValue(
    'current',
  );
  await page.getByRole('combobox', { name: 'Progreso de', exact: true }).selectOption('all');
  await expect(memory).toHaveAttribute('max', '120');
  await expect(page.getByRole('combobox', { name: 'Mostrar', exact: true })).toHaveValue('due');
  await expect(details.locator('article')).toHaveCount(2);
  await expect(details.locator('details')).not.toHaveAttribute('open');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
  await page.screenshot({ animations: 'disabled' });
  const a11y = await new AxeBuilder({ page }).include('main').analyze();
  expect(a11y.violations).toEqual([]);
  if (test.info().project.name === 'chromium') {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.screenshot({ path: '/tmp/progress-scoped-mobile.png', fullPage: true });
  }
});
