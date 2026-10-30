import { it, expect } from 'vitest';
import Dexie from 'dexie';
import { openAppDatabase } from './repositories';
import { bootstrap } from './bootstrap';
import { reconcileSeed } from './seed-sync';
import { adaptLegacyVerb } from '../../shared/domain/validation';
import seed from '../../../tests/fixtures/original/verbs.seed.json';
const clock = { now: () => '2026-10-29T12:00:00Z' };
const v = adaptLegacyVerb(seed.verbs[1]);
if (!v.ok) throw Error('fixture');
const verb = v.value;
it('bootstrap twice does not duplicate profile or seed', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  await bootstrap(r, { version: 'fixture', kind: 'fixture', verbs: [verb] }, clock);
  await bootstrap(r, { version: 'fixture', kind: 'fixture', verbs: [verb] }, clock);
  expect(await r.profiles.count()).toBe(1);
  expect(await r.catalog.count()).toBe(1);
  r.db.close();
});
it('reopen preserves lists and settings', async () => {
  const name = crypto.randomUUID();
  const r = await openAppDatabase(name);
  await r.lists.put({ id: 'x', profileId: 'p', name: 'Examen', verbIds: ['go'] });
  r.db.close();
  const again = await openAppDatabase(name);
  expect((await again.lists.get('x'))!.verbIds).toEqual(['go']);
  again.db.close();
});
it('new seed keeps local edits as conflict', () => {
  const r = reconcileSeed(
    [
      {
        verb: { ...verb, meanings: ['marchar'] },
        locallyModified: true,
        baseVersion: '1',
        pendingBase: null,
      },
    ],
    { version: '2', kind: 'fixture', verbs: [{ ...verb, contentVersion: '2' }] },
  );
  expect(r.entries[0].verb.meanings).toEqual(['marchar']);
  expect(r.conflicts).toEqual(['go']);
});
it('failed transaction keeps all tables unchanged', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  await expect(
    r.runAtomic(async () => {
      await r.lists.put({ id: 'x', profileId: 'p', name: 'Test', verbIds: [] });
      throw Error('quota');
    }),
  ).rejects.toThrow('quota');
  expect(await r.lists.count()).toBe(0);
  r.db.close();
});
it('unsupported future migration does not reset database', async () => {
  const name = crypto.randomUUID();
  const db = new Dexie(name);
  db.version(99).stores({ kept: 'id' });
  await db.open();
  await db.table('kept').put({ id: 'keep' });
  db.close();
  await expect(openAppDatabase(name)).rejects.toThrow();
  const saved = new Dexie(name);
  await saved.open();
  expect(await saved.table('kept').get('keep')).toEqual({ id: 'keep' });
  saved.close();
});
