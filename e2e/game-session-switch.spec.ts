import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
function game(page: Page, title: string) {
  return page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
    .getByRole('button', { name: 'Jugar ahora' });
}
async function startFlashcards(page: Page) {
  await page.goto('/games');
  await page.getByLabel('Selección de verbos').selectOption('manual');
  await page.getByLabel('go · ir', { exact: true }).check();
  await game(page, 'Flashcards').click();
  await page.getByRole('button', { name: 'Revelar respuesta' }).click();
  await page.getByRole('button', { name: 'Lo sabía', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Valoración guardada' })).toBeVisible();
}
async function storedSessions(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('verbquest');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const rows = await new Promise<
      Array<{
        id: string;
        status: string;
        attemptIds: string[];
        queue: Array<{ mode: string; verbId: string }>;
      }>
    >((resolve, reject) => {
      const request = db.transaction('sessions').objectStore('sessions').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return rows;
  });
}
test('a visible mobile dialog can cancel, resume, or replace a pending game', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startFlashcards(page);
  const original = (await storedSessions(page))[0];
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.goto('/games');
  await game(page, 'Completa la frase').click();
  const dialog = page.getByRole('dialog', { name: 'Ya tienes una sesión en marcha' });
  await expect(dialog).toBeInViewport();
  await expect(dialog).toContainText('1 respuesta guardada');
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(await storedSessions(page)).toHaveLength(1);
  await game(page, 'Completa la frase').click();
  await dialog.getByRole('button', { name: 'Continuar sesión anterior', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Flashcards', exact: true })).toBeVisible();
  expect((await storedSessions(page))[0].attemptIds).toHaveLength(1);
  await page.goto('/games');
  await page.getByLabel('Selección de verbos').selectOption('manual');
  await page.getByLabel('go · ir', { exact: true }).check();
  await game(page, 'Completa la frase').click();
  await expect(dialog).toBeInViewport();
  const a11y = await new AxeBuilder({ page }).include('dialog').analyze();
  expect(a11y.violations).toEqual([]);
  await dialog.getByRole('button', { name: 'Cerrar sesión y empezar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Completa la frase', exact: true })).toBeVisible();
  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(2);
  expect(sessions.find((s) => s.id === original.id)?.status).toBe('completed');
  expect(sessions.find((s) => s.id === original.id)?.attemptIds).toHaveLength(1);
  const active = sessions.filter((s) => s.status !== 'completed');
  expect(active).toHaveLength(1);
  expect(active[0].queue.every((q) => q.mode === 'sentence_gap' && q.verbId === 'go')).toBe(true);
});
test('a failed replacement stays visible in the dialog and preserves the old game', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startFlashcards(page);
  const original = (await storedSessions(page))[0];
  await page.goto('/games');
  await page.getByLabel('Selección de verbos').selectOption('manual');
  await game(page, 'Completa la frase').click();
  const dialog = page.getByRole('dialog', { name: 'Ya tienes una sesión en marcha' });
  await expect(dialog).toBeInViewport();
  await dialog.getByRole('button', { name: 'Cerrar sesión y empezar', exact: true }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('alert')).toContainText('La selección no tiene verbos disponibles');
  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(1);
  expect(sessions[0].id).toBe(original.id);
  expect(sessions[0].status).toBe('active');
  expect(sessions[0].attemptIds).toHaveLength(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
