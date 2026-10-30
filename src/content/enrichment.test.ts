import { it, expect } from 'vitest';
import base from './verbs.curated.json';
import { enrichVerbs, type VerbEnrichment } from './enrichment';
import type { Verb } from '../shared/domain/types';
const go = base.find((v) => v.id === 'go') as Verb;
const entry: VerbEnrichment = {
  id: 'go',
  patternGroups: ['Especial_Supletivo', 'ABB'],
  topics: ['movement', 'movement'],
  forms: {
    base: [
      {
        value: 'go',
        pronunciation: {
          uk: { ipa: '/ɡəʊ/', validated: true },
          us: { ipa: '/ɡoʊ/', validated: true },
        },
      },
    ],
    pastSimple: [],
    pastParticiple: [],
  },
};
it('adds metadata without replacing examples, forms, sources, courses or linguistic revision', () => {
  const original = structuredClone(go);
  const [v] = enrichVerbs([go], [entry], []);
  expect(v.examples).toEqual(go.examples);
  expect(v.meanings).toEqual(go.meanings);
  expect(v.sources).toEqual(go.sources);
  expect(v.classification.recommendedCourses).toEqual(go.classification.recommendedCourses);
  expect(v.classification.patternGroups).toContain('Especial_Supletivo');
  expect(v.classification.patternGroups).not.toContain('ABB');
  expect(v.classification.topics?.filter((t) => t === 'movement')).toHaveLength(1);
  expect(v.contentVersion).toBe(go.contentVersion);
  expect(go).toEqual(original);
});
it('does not trust supplied validation flags; only exact reviewed IPA is promoted', () => {
  const [pending] = enrichVerbs([go], [entry], []);
  expect(pending.forms.base.pronunciation?.us?.validated).toBe(false);
  const [checked] = enrichVerbs(
    [go],
    [entry],
    [
      {
        verbId: 'go',
        form: 'base',
        value: 'go',
        dialect: 'us',
        ipa: '/ɡoʊ/',
        source: 'https://dictionary.cambridge.org/pronunciation/english/go',
        checkedAt: '2026-10-30',
      },
    ],
  );
  expect(checked.forms.base.pronunciation?.us?.validated).toBe(true);
  expect(checked.forms.base.pronunciation?.uk?.validated).toBe(false);
});
it('never attaches a combined pronunciation to distinct grammatical variants', () => {
  const be = base.find((v) => v.id === 'be') as Verb;
  const [v] = enrichVerbs(
    [be],
    [
      {
        ...entry,
        id: 'be',
        forms: {
          base: [],
          pastSimple: [
            { value: 'was/were', pronunciation: { uk: { ipa: '/wɒz/ /wɜːr/', validated: true } } },
          ],
          pastParticiple: [],
        },
      },
    ],
    [],
  );
  expect(v.forms.pastSimple).toEqual(be.forms.pastSimple);
});
it('preserves previously reviewed pronunciation and ignores unknown verb identities', () => {
  const reviewed = {
    ...go,
    forms: {
      ...go.forms,
      base: { value: 'go', pronunciation: { uk: { ipa: '/ɡəʊ/', validated: true } } },
    },
  };
  const [v] = enrichVerbs([reviewed], [entry, { ...entry, id: 'unknown' }], []);
  expect(v.forms.base.pronunciation?.uk?.validated).toBe(true);
  expect(v.id).toBe('go');
});
import { dataset } from './dataset';
import { learningRevision } from '../features/question-engine/revision';
it('enriches the production dataset without changing any assessed linguistic content', () => {
  expect(dataset.version).toBe('curated-1.1');
  expect(dataset.verbs).toHaveLength(base.length);
  for (const original of base as Verb[]) {
    const updated = dataset.verbs.find((v) => v.id === original.id)!;
    for (const skill of ['recognition', 'recall', 'listening', 'spelling', 'context'] as const)
      expect(learningRevision(updated, skill)).toBe(learningRevision(original, skill));
    expect(updated.examples).toEqual(original.examples);
    expect(updated.sources).toEqual(original.sources);
    expect(updated.meanings).toEqual(original.meanings);
  }
  expect(dataset.verbs.find((v) => v.id === 'sing')?.classification.patternGroups).toContain(
    'ABC_i_a_u',
  );
});
