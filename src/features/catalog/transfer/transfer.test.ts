import { it, expect } from 'vitest';
import { parseCatalogFile, exportCatalog } from './parse';
import { dataset } from '../../../../tests/fixtures/dataset';
it('CSV BOM Unicode quoted newlines are preserved', () => {
  const r = parseCatalogFile(
    '\ufeffid,base,past_simple,past_participle,meanings_es,notes\ngo,go,went,gone,ir,"línea 1\nlínea 2"',
    'csv',
  );
  expect(r.rows[0]?.verb.notes).toEqual(['línea 1\nlínea 2']);
  expect(r.rows[0]?.verb.lemma).toBe('go');
});
it('reports invalid row path without truncating', () => {
  const r = parseCatalogFile(
    'id,base,past_simple,past_participle,meanings_es\ngo,go,,gone,ir',
    'csv',
  );
  expect(r.issues.some((i: any) => i.row === 2 && i.path.includes('pastSimple'))).toBe(true);
});
it('JSON round trip preserves variants and source metadata', () => {
  const text = exportCatalog(dataset.verbs, 'json');
  expect(parseCatalogFile(text, 'json').rows.map((r: any) => r.verb)).toEqual(dataset.verbs);
});
it('CSV exports formula-looking text as safe text', () => {
  expect(exportCatalog([{ ...dataset.verbs[0], meanings: ['=1+1'] }], 'csv')).toContain("'=1+1");
});
it('rejects excessive file size', () =>
  expect(parseCatalogFile('a'.repeat(5 * 1024 * 1024 + 1), 'csv').issues.length).toBeGreaterThan(
    0,
  ));
import { openAppDatabase } from '../../persistence/repositories';
import { previewImport } from './preview';
import { applyImport } from './apply';
it('requires a duplicate decision and rolls back the whole import', async () => {
  const db = await openAppDatabase(crypto.randomUUID());
  const parsed = parseCatalogFile(exportCatalog(dataset.verbs.slice(0, 2), 'json'), 'json');
  await db.catalog.put({
    verb: dataset.verbs[1],
    baseVersion: null,
    locallyModified: true,
    pendingBase: null,
  });
  const p = await previewImport(db, parsed);
  await expect(applyImport(db, p, [])).rejects.toThrow();
  expect(await db.catalog.count()).toBe(1);
  expect(await db.catalog.get('be')).toBeUndefined();
  const report = await applyImport(db, p, [{ row: 2, choice: 'skip' }]);
  expect(report).toEqual({ applied: 1, skipped: 1 });
  db.close();
});
