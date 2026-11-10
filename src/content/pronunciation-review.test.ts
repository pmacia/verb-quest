import { expect, it } from 'vitest';
import {
  applyPronunciationReview,
  pronunciationReview,
  auditPronunciations,
  reviewedSources,
} from './pronunciation-review';
import base from './verbs.curated.json';
import { curatedDataset as dataset } from './curated-dataset';
import type { Verb } from '../shared/domain/types';
const go = base.find((v) => v.id === 'go') as Verb;
const record = {
  verbId: 'go',
  form: 'base' as const,
  value: 'go',
  dialect: 'us' as const,
  ipa: '/ɡoʊ/',
  source: 'https://www.oxfordlearnersdictionaries.com/definition/american_english/go_1',
  checkedAt: '2026-11-01',
  evidence: { headword: 'go', section: 'headword', sourceIpa: '/ɡoʊ/' },
};
it('applies exact source-backed corrections without mutating forms or audio metadata', () => {
  const original = structuredClone(go);
  original.forms.base.pronunciation = {
    us: { ipa: '/old/', validated: true, audioUrl: '/custom.mp3', audioSource: 'local' },
  };
  const before = structuredClone(original);
  const [updated] = applyPronunciationReview([original], [record]);
  expect(updated.forms.base.pronunciation?.us).toMatchObject({
    ipa: '/ɡoʊ/',
    validated: true,
    audioUrl: '/custom.mp3',
    audioSource: 'local',
  });
  expect(original).toEqual(before);
  expect(updated.examples).toEqual(go.examples);
  expect(updated.forms.pastSimple).toEqual(go.forms.pastSimple);
});
it('rejects unsupported evidence, mismatched spellings and grammatical variants', () => {
  for (const bad of [
    { ...record, value: 'went' },
    { ...record, form: 'pastSimple' as const },
    { ...record, source: 'https://example.com/go' },
    { ...record, evidence: { ...record.evidence, sourceIpa: '/ɡəʊ/' } },
    { ...record, checkedAt: '' },
  ]) {
    expect(applyPronunciationReview([go], [bad])[0]).toEqual(go);
  }
});
it('has complete unique provenance for every existing spelling in both dialects', () => {
  const audit = auditPronunciations(dataset.verbs, pronunciationReview);
  expect(audit.expected).toBe(756);
  expect(audit.validated).toBe(756);
  expect(audit.issues).toEqual([]);
  expect(audit.byDialect).toEqual({
    uk: { expected: 378, validated: 378 },
    us: { expected: 378, validated: 378 },
  });
});
it('keeps read tenses distinct and corrects known chart/source discrepancies', () => {
  const read = dataset.verbs.find((v) => v.id === 'read')!;
  expect(read.forms.base.pronunciation?.uk?.ipa).toBe('/riːd/');
  expect(read.forms.pastSimple.variants[0].pronunciation?.uk?.ipa).toBe('/red/');
  expect(dataset.verbs.find((v) => v.id === 'be')!.forms.base.pronunciation?.uk?.ipa).toBe('/biː/');
  expect(dataset.verbs.find((v) => v.id === 'swing')!.forms.base.pronunciation?.uk?.ipa).toBe(
    '/swɪŋ/',
  );
  expect(
    dataset.verbs
      .find((v) => v.id === 'get')!
      .forms.pastParticiple.variants.find((v) => v.value === 'gotten')?.pronunciation?.us
      ?.validated,
  ).toBe(true);
});
it('does not attribute a locally changed transcription to the bundled source', () => {
  const [updated] = applyPronunciationReview([go], [record]);
  expect(reviewedSources(updated, [record])).toEqual([record.source]);
  updated.forms.base.pronunciation!.us!.ipa = '/edited/';
  expect(reviewedSources(updated, [record])).toEqual([]);
  expect(auditPronunciations([updated], [record]).issues.length).toBeGreaterThan(0);
});
