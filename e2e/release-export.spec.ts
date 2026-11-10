import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { editedVerb } from '../tests/fixtures/edited-verb';
async function download(page: Page, name: string) {
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name, exact: true }).click();
  const file = await event;
  return { name: file.suggestedFilename(), bytes: await readFile((await file.path())!) };
}

test('full source ZIP ignores list scope and exports a direct loader without profile data', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/verbs');
  await page.getByRole('checkbox', { name: 'Seleccionar go', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar en lista', exact: true }).click();
  await page.getByLabel('Nombre de la lista', { exact: true }).fill('Privada');
  await page.getByRole('button', { name: 'Guardar lista', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Privada 1', exact: true })).toBeVisible();
  await page.goto('/editor/import-export');
  await page
    .getByRole('combobox', { name: 'Selección', exact: true })
    .selectOption({ label: 'Privada' });
  const json = JSON.parse((await download(page, 'JSON')).bytes.toString());
  expect(json.verbs).toHaveLength(1);
  await page.locator('.transfer-release-summary').click();
  const baseVersion = await page.locator('.transfer-scope code').textContent();
  const version = baseVersion === 'e2e-release' ? 'e2e-release-2' : 'e2e-release';
  await page.getByLabel('Nueva versión del catálogo').fill(version);
  const result = await download(page, 'Descargar catálogo base ZIP');
  expect(result.name).toBe(`verbquest-base-${version}.zip`);
  const files = unzipSync(result.bytes);
  const release = JSON.parse(strFromU8(files['src/content/catalog.release.json']));
  expect(Object.keys(release).sort()).toEqual(['kind', 'verbs', 'version']);
  expect(release.verbs).toHaveLength(120);
  expect(release.verbs.every((verb: { icon?: string }) => !!verb.icon)).toBe(true);
  expect(strFromU8(files['src/content/dataset.ts'])).not.toContain('applyFormTranslations');
  expect(strFromU8(files['PUBLICATION_REPORT.json'])).not.toContain('Privada');
  await expect(page.getByRole('status')).toContainText('sin incidencias automáticas detectadas');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('rich editor fields survive browser import, JSON export, backup and restore', async ({
  page,
}) => {
  await page.goto('/editor/import-export');
  const original = JSON.parse((await download(page, 'JSON')).bytes.toString()).verbs.find(
    (v: { id: string }) => v.id === 'get',
  );
  const verb = editedVerb(original);
  async function importVerb(icon: string) {
    await page.getByLabel('Archivo del catálogo').setInputFiles({
      name: 'verb.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ verbs: [{ ...verb, icon }] })),
    });
    await page.getByLabel('Decisión para fila 1').selectOption('update');
    await page.getByRole('button', { name: 'Revisar importación' }).click();
    await page.getByRole('button', { name: 'Confirmar y guardar' }).click();
    await expect(page.getByRole('status')).toContainText('1 entradas importadas');
  }
  await importVerb(verb.icon!);
  const exported = JSON.parse((await download(page, 'JSON')).bytes.toString());
  const saved = exported.verbs.find((v: { id: string }) => v.id === verb.id);
  expect(saved).toEqual({ ...verb, contentVersion: saved.contentVersion });
  const copy = await download(page, 'Descargar copia completa');
  await importVerb('🌟');
  await page
    .getByLabel('Restaurar copia JSON')
    .setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: copy.bytes });
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar reemplazo definitivo' }).click();
  await page.waitForURL('/');
  await page.goto('/editor/import-export');
  const restored = JSON.parse((await download(page, 'JSON')).bytes.toString()).verbs.find(
    (v: { id: string }) => v.id === verb.id,
  );
  expect(restored).toEqual(saved);
});

test('advanced export rejects current version and stale import previews disappear after invalid files', async ({
  page,
}) => {
  await page.goto('/editor/import-export');
  const original = JSON.parse((await download(page, 'JSON')).bytes.toString()).verbs.find(
    (v: { id: string }) => v.id === 'get',
  );
  await page.getByLabel('Archivo del catálogo').setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ verbs: [editedVerb(original)] })),
  });
  await expect(page.getByLabel('Decisión para fila 1')).toBeVisible();
  await page
    .getByLabel('Archivo del catálogo')
    .setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByLabel('Decisión para fila 1')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Revisar importación' })).toBeDisabled();
  await page.locator('.transfer-release-summary').click();
  const baseVersion = await page.locator('.transfer-scope code').textContent();
  await page.getByLabel('Nueva versión del catálogo').fill(baseVersion!);
  await page.getByRole('button', { name: 'Descargar catálogo base ZIP' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'versión distinta' })).toBeVisible();
});
