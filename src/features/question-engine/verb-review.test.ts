import { expect, it } from 'vitest';
import { dataset } from '../../../tests/fixtures/dataset';
import { generateQuestions } from './generate';
import { evaluateAnswer } from './evaluate';
import type { Question, Verb } from '../../shared/domain/types';
const buy = dataset.verbs.find((v) => v.id === 'buy')!;
function question(verb: Verb = buy, language = 'es'): Question {
  return generateQuestions(
    {
      verbs: [verb],
      modes: ['verb_review' as any],
      skills: ['recall'],
      dialect: 'uk',
      allowFixtures: true,
      reviewLanguage: language,
    } as any,
    () => 0.5,
  ).questions[0];
}
const input = (answer: string[], inputMethod = 'keyboard') =>
  ({ answer, inputMethod, hintsUsed: false, revealed: false }) as any;
it('generates one three-form snapshot per verb instead of three separate questions', () => {
  const qs = generateQuestions(
    {
      verbs: [buy],
      modes: ['verb_review' as any],
      skills: ['recall'],
      dialect: 'uk',
      allowFixtures: true,
    } as any,
    () => 0.5,
  ).questions;
  expect(qs).toHaveLength(1);
  expect((qs[0] as any).review.forms.map((f: any) => f.form)).toEqual([
    'base',
    'pastSimple',
    'pastParticiple',
  ]);
});
it('checks all three written columns in order without fuzzy corrections', () => {
  const q = question();
  expect(evaluateAnswer(q, input(['buy', 'bought', 'bought'])).correct).toBe(true);
  expect(evaluateAnswer(q, input(['by', 'bought', 'bought'])).correct).toBe(false);
  expect(evaluateAnswer(q, input(['bought', 'buy', 'bought'])).correct).toBe(false);
});
it('accepts controlled speech homophones without conflating different tense forms', () => {
  expect(evaluateAnswer(question(), input(['by', 'bought', 'bought'], 'voice')).correct).toBe(true);
  const verb = {
    ...buy,
    forms: {
      ...buy.forms,
      base: { value: 'come' },
      pastSimple: { variants: [{ value: 'came' }] },
      pastParticiple: { variants: [{ value: 'come' }] },
    },
  };
  expect(evaluateAnswer(question(verb), input(['came', 'came', 'come'], 'voice')).correct).toBe(
    false,
  );
});
it('does not credit a base form already supplied by an English prompt', () => {
  const result = evaluateAnswer(question(buy, 'en'), input(['buy', 'bought', 'bought'])) as any;
  expect(result.coverageTargetIds).toEqual(['pastSimple', 'pastParticiple']);
});
it('credits only the actual be variants supplied', () => {
  const be = dataset.verbs.find((v) => v.id === 'be')!;
  const result = evaluateAnswer(question(be), input(['be', 'was', 'been'])) as any;
  expect(result.correct).toBe(true);
  expect(result.coverageTargetIds).toContain('pastSimple:was');
  expect(result.coverageTargetIds).not.toContain('pastSimple:were');
});
it('keeps retries assisted even if the browser does not send a revealed flag', () => {
  expect(
    evaluateAnswer({ ...question(), retryOf: 'first' }, input(['buy', 'bought', 'bought']))
      .assisted,
  ).toBe(true);
});

it('does not automatically choose an expected answer from conflicting speech alternatives', async () => {
  const { resolveReviewSpeech } = await import('./verb-review');
  const verb = {
    ...buy,
    forms: {
      ...buy.forms,
      base: { value: 'come' },
      pastSimple: { variants: [{ value: 'came' }] },
      pastParticiple: { variants: [{ value: 'come' }] },
    },
  };
  expect(resolveReviewSpeech(question(verb), ['come came come', 'came came come']).automatic).toBe(
    false,
  );
  expect(resolveReviewSpeech(question(), ['buy bought bought', 'by bought bought']).automatic).toBe(
    true,
  );
  expect(resolveReviewSpeech(question(), ['buy bought']).automatic).toBe(false);
});
it('applies homophones only to fields actually entered by voice', () => {
  const result = evaluateAnswer(question(), {
    ...input(['by', 'bought', 'bought'], 'mixed'),
    fieldMethods: ['keyboard', 'voice', 'voice'],
  } as any);
  expect(result.correct).toBe(false);
});
it('offers only unique voice typo suggestions and never substitutes another valid tense', async () => {
  const { reviewSuggestion } = await import('./verb-review');
  expect(reviewSuggestion(question(), 'bougt', 1)).toBe('bought');
  expect(reviewSuggestion(question(), 'brought', 1, ['brought'])).toBeUndefined();
  const verb = {
    ...buy,
    forms: {
      ...buy.forms,
      base: { value: 'come' },
      pastSimple: { variants: [{ value: 'came' }] },
      pastParticiple: { variants: [{ value: 'come' }] },
    },
  };
  expect(reviewSuggestion(question(verb), 'came', 0)).toBeUndefined();
});
it('snapshots only the selected dialect and keeps the tense-specific read sounds', async () => {
  const { makeReviewQuestion, resolveReviewSpeech } = await import('./verb-review');
  const verb = {
    ...buy,
    forms: {
      ...buy.forms,
      base: { value: 'get' },
      pastSimple: { variants: [{ value: 'got', dialect: 'all' as const }] },
      pastParticiple: {
        variants: [
          { value: 'got', dialect: 'uk' as const },
          { value: 'gotten', dialect: 'us' as const },
        ],
      },
    },
  };
  expect(
    evaluateAnswer(makeReviewQuestion(verb, 'uk', 'es')!, input(['get', 'got', 'gotten'])).correct,
  ).toBe(false);
  expect(
    evaluateAnswer(makeReviewQuestion(verb, 'us', 'es')!, input(['get', 'got', 'gotten'])).correct,
  ).toBe(true);
  const read = {
    ...buy,
    forms: {
      ...buy.forms,
      base: { value: 'read' },
      pastSimple: { variants: [{ value: 'read' }] },
      pastParticiple: { variants: [{ value: 'read' }] },
    },
  };
  expect(resolveReviewSpeech(question(read), ['reed red red']).automatic).toBe(true);
  expect(resolveReviewSpeech(question(read), ['red red red']).automatic).toBe(false);
});
it('rejects imported review snapshots with columns in a different order', async () => {
  const { validate } = await import('../../shared/domain/validation');
  const q = question();
  expect(validate('question', q).ok).toBe(true);
  expect(
    validate('question', { ...q, review: { ...q.review!, forms: [...q.review!.forms].reverse() } })
      .ok,
  ).toBe(false);
});
it('requires review when more alternatives arrive than can be safely evaluated', async () => {
  const { resolveReviewSpeech } = await import('./verb-review');
  expect(
    resolveReviewSpeech(question(), [...Array(12).fill('buy bought bought'), 'buy buy buy'])
      .automatic,
  ).toBe(false);
});
