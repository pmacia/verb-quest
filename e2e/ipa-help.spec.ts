import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('IPA guide explains symbols, works by keyboard and keeps normal mode unobtrusive', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/verbs');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Cómo leer los sonidos', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Cómo leer los símbolos IPA', exact: true });
  await expect(dialog.getByRole('heading', { name: 'Vocales', exact: true })).toBeVisible();
  await expect(dialog).toContainText('ˈ');
  await expect(dialog).toContainText('ː');
  await expect(dialog).toContainText('(r)');
  await expect(dialog.getByText('/ŋ/', { exact: true })).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.goto('/verbs/write');
  await expect(page.locator('main')).not.toContainText('IPA');
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Modo IPA estricto' }).check();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.goto('/verbs/write');
  await expect(page.getByText('write · IPA UK: /raɪt/', { exact: true })).toBeVisible();
  await expect(
    page.getByText('IPA propuesta · pendiente de revisión', { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Oxford/ }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Cómo leer los sonidos', exact: true }).click();
  await expect(dialog).toBeVisible();
});

test('edited cards can adopt verified IPA without replacing their local meaning', async ({
  page,
}) => {
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Modo IPA estricto' }).check();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('verbquest');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('catalog', 'readwrite');
          const store = tx.objectStore('catalog');
          const get = store.get('go');
          get.onsuccess = () => {
            const entry = get.result;
            entry.baseVersion = 'curated-1.1';
            entry.locallyModified = true;
            entry.pendingBase = null;
            entry.verb.meanings = ['mi traducción personal'];
            entry.verb.forms.base.pronunciation.us = { ipa: '/old/', validated: false };
            store.put(entry);
          };
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
  );
  await page.reload();
  await page.goto('/editor/verbs/go');
  await page
    .getByRole('button', { name: 'Actualizar solo IPA y conservar mi ficha', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Tus otros cambios se conservan');
  await expect(
    page.getByRole('heading', { name: 'Hay una actualización del contenido base', exact: true }),
  ).toHaveCount(0);
  await page.goto('/verbs/go');
  await expect(page.getByText('mi traducción personal', { exact: true })).toBeVisible();
  await expect(page.getByText('go · IPA US: /ɡoʊ/', { exact: true })).toBeVisible();
});
