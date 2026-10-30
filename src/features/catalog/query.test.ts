import { it, expect } from 'vitest';
import { queryCatalog } from './query';
import { saveList } from './list-service';
import { openAppDatabase } from '../persistence/repositories';
import { adaptLegacyVerb } from '../../shared/domain/validation';
import seed from '../../../tests/fixtures/original/verbs.seed.json';
const verbs = seed.verbs.map((x) => {
  const r = adaptLegacyVerb(x);
  if (!r.ok) throw Error('fixture');
  return r.value;
});
const q = { text: '', filter: {}, sort: 'alphabetical', direction: 'asc' } as const;
const ctx = { lists: [], progress: [], today: '2026-10-29' };
it('finds go by went and ignores case', () =>
  expect(queryCatalog(verbs, { ...q, text: 'WeNt' }, ctx).items.map((x) => x.id)).toEqual(['go']));
it('normalizes accents in Spanish meanings', () =>
  expect(
    queryCatalog([{ ...verbs[1], meanings: ['reír'] }], { ...q, text: 'reir' }, ctx).total,
  ).toBe(1));
it('combines relation course and list filters', () =>
  expect(
    queryCatalog(
      verbs,
      { ...q, filter: { relations: ['past_participle_same'], courses: ['eso2'], listIds: ['l'] } },
      { ...ctx, lists: [{ id: 'l', verbIds: ['go', 'buy'] }] },
    ).items.map((x) => x.id),
  ).toEqual(['buy']));
it('orders overdue reviews before new verbs', () =>
  expect(
    queryCatalog(
      verbs,
      { ...q, sort: 'review' },
      { ...ctx, progress: [{ verbId: 'write', dueDate: '2026-10-20' }] },
    ).items[0]?.id,
  ).toBe('write'));
it('does not filter by unvalidated IPA', () =>
  expect(
    queryCatalog(
      verbs,
      { ...q, filter: { phonetic: [{ form: 'base', dialect: 'uk', ending: 'əʊ/' }] } },
      ctx,
    ).total,
  ).toBe(0));
it('saved list retains order and removes duplicate IDs', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  const l = await saveList(r, 'p', {
    name: 'Examen',
    verbIds: ['go', 'be', 'go', 'take', 'buy', 'write'],
  });
  expect(l.verbIds).toEqual(['go', 'be', 'take', 'buy', 'write']);
  expect((await r.lists.get(l.id))?.name).toBe('Examen');
  r.close();
});
