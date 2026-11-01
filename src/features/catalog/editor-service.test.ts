import { dataset as production } from '../../content/dataset';
import { it, expect } from 'vitest';
import { saveVerb, archiveVerb, restoreVerb, resolveSeedConflict } from './editor-service';
import { openAppDatabase } from '../persistence/repositories';
import { adaptLegacyVerb } from '../../shared/domain/validation';
import seed from '../../../tests/fixtures/original/verbs.seed.json';
const r = adaptLegacyVerb(seed.verbs[1]);
if (!r.ok) throw Error('fixture');
const verb = r.value;
const clock = { now: () => '2026-10-29T12:00:00Z' };
it('creates a verb with stable ID and finds conflicts on stale saves', async () => {
  const db = await openAppDatabase(crypto.randomUUID());
  const first = await saveVerb(db, verb, null);
  if (first.status !== 'saved') throw Error('Save failed');
  expect(first.verb.id).toBe('go');
  expect((await db.catalog.get('go'))?.verb.lemma).toBe('go');
  expect((await saveVerb(db, { ...verb, meanings: ['marchar'] }, 'outdated')).status).toBe(
    'conflict',
  );
  db.close();
});
it('archives without removing references and restores editorial status', async () => {
  const db = await openAppDatabase(crypto.randomUUID());
  await db.catalog.put({ verb, baseVersion: '1', locallyModified: false, pendingBase: null });
  await db.lists.put({ id: 'l', profileId: 'p', name: 'Lista', verbIds: ['go'] });
  await archiveVerb(db, 'go', clock);
  expect((await db.catalog.get('go'))?.verb.archivedAt).toBe('2026-10-29T12:00:00Z');
  expect((await db.lists.get('l'))?.verbIds).toEqual(['go']);
  await restoreVerb(db, 'go');
  expect((await db.catalog.get('go'))?.verb.editorialStatus).toBe('needs_review');
  expect((await db.catalog.get('go'))?.verb.archivedAt).toBeNull();
  db.close();
});
it('rejects missing forms and warns about probable duplicates', async () => {
  const db = await openAppDatabase(crypto.randomUUID());
  expect((await saveVerb(db, { ...verb, meanings: [] }, null)).status).toBe('invalid');
  await saveVerb(db, verb, null);
  expect((await saveVerb(db, { ...verb, id: 'go-copy' }, null)).status).toBe('duplicate');
  db.close();
});

it('adopts only verified IPA while retaining local spellings, meaning, archive status and lists', async () => {
  const db = await openAppDatabase(crypto.randomUUID());
  const remote = production.verbs.find((v) => v.id === 'go')!;
  const local = structuredClone(verb);
  local.meanings = ['mi traducción'];
  local.archivedAt = clock.now();
  local.forms.pastSimple.variants[0].value = 'custom-past';
  await db.catalog.put({
    verb: local,
    baseVersion: 'curated-1.1',
    locallyModified: true,
    pendingBase: remote,
  });
  await db.meta.put({ id: 'datasetVersion', value: production.version });
  await db.lists.put({ id: 'l', profileId: 'p', name: 'Mi lista', verbIds: ['go'] });
  await resolveSeedConflict(db, 'go', 'ipa_only');
  const updated = (await db.catalog.get('go'))!;
  expect(updated.verb.meanings).toEqual(local.meanings);
  expect(updated.verb.archivedAt).toBe(local.archivedAt);
  expect(updated.verb.forms.pastSimple).toEqual(local.forms.pastSimple);
  expect(updated.verb.forms.base.pronunciation?.us).toMatchObject({
    ipa: '/ɡoʊ/',
    validated: true,
  });
  expect(updated.pendingBase).toBeNull();
  expect(updated.locallyModified).toBe(true);
  expect((await db.lists.get('l'))?.verbIds).toEqual(['go']);
  db.close();
});
it('does not promote an unsupported IPA claim from a pending base', async () => {
  const db = await openAppDatabase(crypto.randomUUID());
  const remote = structuredClone(production.verbs.find((v) => v.id === 'go')!);
  remote.forms.base.pronunciation!.us = { ipa: '/unsupported/', validated: true };
  await db.catalog.put({
    verb: structuredClone(verb),
    baseVersion: 'old',
    locallyModified: true,
    pendingBase: remote,
  });
  await resolveSeedConflict(db, 'go', 'ipa_only');
  expect((await db.catalog.get('go'))!.verb.forms.base.pronunciation?.us).toEqual(
    verb.forms.base.pronunciation?.us,
  );
  db.close();
});
it('rejects stale saves after adopting IPA and retains pending updates without matching local forms', async () => {
  const db = await openAppDatabase(crypto.randomUUID());
  const remote = production.verbs.find((v) => v.id === 'go')!;
  await db.catalog.put({ verb, baseVersion: 'old', locallyModified: true, pendingBase: remote });
  await resolveSeedConflict(db, 'go', 'ipa_only');
  expect((await saveVerb(db, verb, verb.contentVersion)).status).toBe('conflict');
  const custom = structuredClone(verb);
  custom.forms.base.value = 'custom-base';
  custom.forms.pastSimple.variants.forEach((v) => {
    v.value = 'custom-past';
  });
  custom.forms.pastParticiple.variants.forEach((v) => {
    v.value = 'custom-participle';
  });
  await db.catalog.put({
    verb: custom,
    baseVersion: 'old',
    locallyModified: true,
    pendingBase: remote,
  });
  await expect(resolveSeedConflict(db, 'go', 'ipa_only')).rejects.toThrow('compatibles');
  expect((await db.catalog.get('go'))?.pendingBase).toEqual(remote);
  db.close();
});
