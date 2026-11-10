import { it, expect } from 'vitest';
import { generateQuestions } from './generate';
import { evaluateAnswer } from './evaluate';
import { getCoverageTargets } from './coverage';
import { dataset } from '../../../tests/fixtures/dataset';
import type { Question, AnswerInput } from '../../shared/domain/types';
const q: Question = {
  id: 'q',
  version: '1',
  verbId: 'be',
  contentVersion: '1',
  mode: 'sentence_gap',
  skill: 'context',
  target: 'pastSimple',
  coverageTargetIds: ['pastSimple:were'],
  prompt: 'They ____ at school yesterday.',
  acceptedAnswers: ['were'],
  options: [],
  explanation: 'Plural subject.',
  evidenceKind: 'objective',
  isWritten: true,
};
const answer = (s: string): AnswerInput => ({
  attemptId: 'a',
  sessionId: 's',
  questionId: 'q',
  answer: s,
  hintsUsed: false,
  revealed: false,
  at: '2026-10-29T00:00:00Z',
});
it('was is not accepted for they were', () =>
  expect(evaluateAnswer(q, answer('was')).correct).toBe(false));
it('normalizes case and outside whitespace but never spelling errors', () => {
  expect(evaluateAnswer(q, answer(' WERE ')).correct).toBe(true);
  expect(evaluateAnswer(q, answer('w ere')).correct).toBe(false);
});
it('revealed answer is assisted and flashcards have no objective score', () => {
  expect(evaluateAnswer(q, { ...answer('were'), revealed: true }).assisted).toBe(true);
  expect(evaluateAnswer({ ...q, evidenceKind: 'self_report' }, answer('were')).correct).toBeNull();
});
it('unreviewed sentence is excluded in production', () => {
  const r = generateQuestions(
    {
      verbs: dataset.verbs,
      skills: ['context'],
      modes: ['sentence_gap'],
      dialect: 'uk',
      allowFixtures: false,
    },
    () => 0.5,
  );
  expect(r.questions).toHaveLength(0);
  expect(r.unavailable.length).toBeGreaterThan(0);
});
it('recognition is not recall and distractors are never valid answers', () => {
  const r = generateQuestions(
    {
      verbs: dataset.verbs,
      skills: ['recognition'],
      modes: ['quiz'],
      dialect: 'uk',
      allowFixtures: true,
    },
    () => 0.5,
  );
  expect(r.questions.length).toBeGreaterThan(0);
  for (const q of r.questions) {
    expect(q.skill).toBe('recognition');
    expect(q.options.filter((s: string) => q.acceptedAnswers.includes(s))).toHaveLength(1);
  }
});
it('coverage includes both noninterchangeable be past forms', () =>
  expect(getCoverageTargets(dataset.verbs[0], 'recall', 'uk').map((t) => t.id)).toEqual([
    'base',
    'pastSimple:was',
    'pastSimple:were',
    'pastParticiple',
  ]));
import curated from '../../content/verbs.curated.json';
import type { Verb } from '../../shared/domain/types';
it('uses dialect-specific sentences and isolated form-specific read audio', () => {
  const get = (curated as Verb[]).find((v) => v.id === 'get')!;
  const read = (curated as Verb[]).find((v) => v.id === 'read')!;
  const questions = generateQuestions(
    {
      verbs: [get],
      skills: ['context'],
      modes: ['sentence_gap'],
      dialect: 'us',
      allowFixtures: false,
    },
    () => 0.5,
  ).questions;
  expect(questions.find((q) => q.target === 'pastParticiple')?.acceptedAnswers).toEqual(['gotten']);
  const readQuestions = generateQuestions(
    {
      verbs: [read],
      skills: ['listening'],
      modes: ['audio_detective'],
      dialect: 'uk',
      allowFixtures: false,
    },
    () => 0.5,
  ).questions;
  expect(readQuestions.map((q) => q.audioText)).toEqual(['reed', 'red', 'red']);
  expect(readQuestions.every((q) => q.acceptedAnswers.includes('read'))).toBe(true);
});
it('preserves subject-dependent be variants when an imported verb has a new identity', () => {
  const copied: Verb = { ...dataset.verbs[0], id: 'be-imported', editorialStatus: 'validated' };
  const qs = generateQuestions(
    {
      verbs: [copied, ...dataset.verbs.slice(1, 4)],
      skills: ['recognition'],
      modes: ['quiz'],
      dialect: 'uk',
      allowFixtures: true,
    },
    () => 0.5,
  ).questions.filter((q) => q.verbId === 'be-imported' && q.target === 'pastSimple');
  expect(qs).toHaveLength(2);
  expect(qs.map((q) => q.acceptedAnswers)).toEqual([['was'], ['were']]);
});
it('generates real matching boards with several associations', () => {
  const qs = generateQuestions(
    {
      verbs: dataset.verbs,
      skills: ['recognition'],
      modes: ['matching'],
      dialect: 'uk',
      allowFixtures: true,
    },
    () => 0.5,
  ).questions;
  expect(qs[0].matchingPairs?.length).toBeGreaterThanOrEqual(3);
});
it('matching checks every association, including repeated identical forms', () => {
  const board = generateQuestions(
    {
      verbs: dataset.verbs,
      skills: ['recognition'],
      modes: ['matching'],
      dialect: 'uk',
      allowFixtures: true,
    },
    () => 0.5,
  ).questions[0];
  const correct = board.matchingPairs!.map((pair) => JSON.stringify([pair.id, pair.right]));
  expect(evaluateAnswer(board, { ...answer(''), answer: correct }).correct).toBe(true);
  expect(evaluateAnswer(board, { ...answer(''), answer: correct.slice(1) }).correct).toBe(false);
  expect(
    evaluateAnswer(board, { ...answer(''), answer: correct.map(() => correct[0]) }).correct,
  ).toBe(false);
  expect(
    evaluateAnswer(board, {
      ...answer(''),
      answer: correct.map((v, i) =>
        i ? v : JSON.stringify([board.matchingPairs![0].id, 'wrong']),
      ),
    }).correct,
  ).toBe(false);
});

it('uses the supplied RNG to vary compatible contextual examples reproducibly', () => {
  const verb = structuredClone((curated as Verb[]).find((v) => v.id === 'go')!);
  const first = verb.examples.find((e) => e.form === 'base')!;
  verb.examples = [
    first,
    {
      ...first,
      id: 'different-base',
      sentence: 'Please go home before dark.',
      translation: 'Por favor, vuelve a casa antes de que anochezca.',
    },
  ];
  const input = {
    verbs: [verb],
    skills: ['context'] as const,
    modes: ['sentence_gap'] as const,
    dialect: 'uk' as const,
    allowFixtures: false,
  };
  const generate = (value: number) =>
    generateQuestions({ ...input, skills: [...input.skills], modes: [...input.modes] }, () => value)
      .questions;
  expect(generate(0).find((q) => q.target === 'base')!.prompt).not.toBe(
    generate(0.999).find((q) => q.target === 'base')!.prompt,
  );
  expect(generate(0.999).map((q) => q.prompt)).toEqual(generate(0.999).map((q) => q.prompt));
});
it('never selects invalid or unreviewed contextual candidates when varying examples', () => {
  const verb = structuredClone((curated as Verb[]).find((v) => v.id === 'go')!);
  const first = verb.examples.find((e) => e.form === 'base')!;
  verb.examples = [
    { ...first, id: 'bad-target', sentence: 'There is no target here.' },
    { ...first, id: 'draft', sentence: 'We go to the beach.', reviewStatus: 'draft' },
    first,
  ];
  const result = generateQuestions(
    {
      verbs: [verb],
      skills: ['context'],
      modes: ['sentence_gap'],
      dialect: 'uk',
      allowFixtures: false,
    },
    () => 0,
  );
  expect(result.questions.find((q) => q.target === 'base')?.explanation).toContain(first.sentence);
});
