import { expect, it } from 'vitest';
import { learningRevision } from '../question-engine/revision';
import { mergeDefinitions } from './definitions';
import { validate } from '../../shared/domain/validation';
import { curatedDataset } from '../../content/curated-dataset';
import type { VerbDefinition } from '../../shared/domain/types';
const source = {
  label: 'Cambridge Dictionary · paráfrasis',
  url: 'https://dictionary.cambridge.org/dictionary/english/arise',
  checkedAt: '2026-11-10',
};
it('combines identical wording across dialects without losing provenance or review state', () => {
  const definitions: VerbDefinition[] = [
    { text: 'To start happening.', dialects: ['uk'], sources: [source], reviewStatus: 'validated' },
    { text: ' To start happening. ', dialects: ['us'], sources: [], reviewStatus: 'needs_review' },
    { text: 'To move upwards.', dialects: ['us'], sources: [], reviewStatus: 'validated' },
  ];
  const result = mergeDefinitions(definitions);
  expect(result).toHaveLength(2);
  expect(result[0]).toEqual({
    ...definitions[0],
    dialects: ['uk', 'us'],
    reviewStatus: 'needs_review',
  });
  expect(definitions[0].dialects).toEqual(['uk']);
});
it('keeps old records valid and rejects empty text, dialects or bad sources', () => {
  const verb = structuredClone(curatedDataset.verbs[0]);
  delete verb.definitions;
  expect(validate('verb', verb).ok).toBe(true);
  for (const invalid of [
    { text: ' ', dialects: ['uk'], sources: [], reviewStatus: 'needs_review' },
    { text: 'A definition', dialects: [], sources: [], reviewStatus: 'needs_review' },
    { text: 'A definition', dialects: ['other'], sources: [], reviewStatus: 'needs_review' },
  ]) {
    expect(validate('verb', { ...verb, definitions: [invalid] }).ok).toBe(false);
  }
});
it('covers all curated verbs in simple English without changing learning evidence', () => {
  expect(curatedDataset.verbs).toHaveLength(120);
  for (const verb of curatedDataset.verbs) {
    expect(verb.definitions?.length, verb.id).toBeGreaterThan(0);
    expect(validate('verb', verb).ok, verb.id).toBe(true);
    expect(
      verb.definitions!.every((d) =>
        d.sources.some((s) => s.url?.startsWith('https://dictionary.cambridge.org/')),
      ),
      verb.id,
    ).toBe(true);
  }
});

it('definitions are explanatory content and do not invalidate assessed learning evidence', () => {
  const verb = structuredClone(curatedDataset.verbs[0]);
  const old = structuredClone(verb);
  delete old.definitions;
  for (const skill of ['recognition', 'recall', 'listening', 'spelling', 'context'] as const)
    expect(learningRevision(verb, skill)).toBe(learningRevision(old, skill));
});
