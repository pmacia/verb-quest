import { emptyProgress } from '../learning-engine/progress';
import { generateQuestions } from '../question-engine/generate';
import { it, expect } from 'vitest';
import { resolvePlanSelection, validatePlanCompatibility, templates } from './plan-service';
import { buildSession } from '../learning-engine/build-session';
import { dataset } from '../../../tests/fixtures/dataset';
const plan = {
  id: 'p',
  profileId: 'p',
  name: 'Examen',
  source: { type: 'saved_list', listId: 'l' },
  goals: ['learn'],
  schedule: { minutesPerSession: 10, newVerbsPerSession: 1, remindersEnabled: false },
  questionModes: ['quiz'],
  order: 'adaptive',
  difficulty: 'all',
  selectionPolicy: 'resolve_at_start',
  createdAt: '2026-10-29T00:00:00Z',
} as any;
it('offers nine editable templates', () => expect(templates).toHaveLength(9));
it('resolves saved lists and excludes archived verbs with explanation', () => {
  const r = resolvePlanSelection(plan, {
    verbs: dataset.verbs.map((v) =>
      v.id === 'be' ? { ...v, archivedAt: '2026-10-29T00:00:00Z' } : v,
    ),
    lists: [{ id: 'l', profileId: 'p', name: 'Lista', verbIds: ['be', 'go', 'take'] }],
    progress: [],
  });
  expect(r.verbIds).toEqual(['go', 'take']);
  expect(r.excludedIds).toEqual(['be']);
  expect(r.reasons.length).toBeGreaterThan(0);
});
it('rejects spelling goals without written practice and empty selection', () => {
  expect(
    validatePlanCompatibility({ ...plan, goals: ['spelling'] }, { questions: [], unavailable: [] })
      .length,
  ).toBeGreaterThan(0);
});
it('new verb limit never hides due reviews and queue keeps immutable snapshots', () => {
  const questions = generateQuestions(
    {
      verbs: dataset.verbs.filter((v) => ['be', 'go', 'take'].includes(v.id)),
      skills: ['recognition'],
      modes: ['quiz'],
      dialect: 'uk',
      allowFixtures: true,
    },
    () => 0.5,
  ).questions;
  const s = buildSession(
    {
      profileId: 'p',
      plan,
      selection: { verbIds: ['be', 'go', 'take'], excludedIds: [], reasons: [] },
      questions,
      progress: [{ ...emptyProgress('p', 'take', 'recognition'), dueDate: '2026-10-20', stage: 1 }],
      today: '2026-10-29',
    },
    { now: () => '2026-10-29T00:00:00Z' },
    () => 0.5,
  );
  expect(s.queue[0]?.verbId).toBe('take');
  expect(
    new Set(s.queue.filter((q: any) => q.verbId !== 'take').map((q: any) => q.verbId)).size,
  ).toBe(1);
  questions[0].contentVersion = '2';
  expect(s.queue.find((q: any) => q.verbId === 'be')?.contentVersion).not.toBe('2');
});
it('a mixed short session gives each chosen verb and skill a place', () => {
  const verbs = dataset.verbs.filter((v) => ['go', 'take', 'buy', 'write'].includes(v.id));
  const questions = generateQuestions(
    {
      verbs,
      skills: ['recognition', 'recall', 'listening', 'spelling', 'context'],
      modes: [
        'flashcards',
        'matching',
        'quiz',
        'written_recall',
        'audio_detective',
        'sentence_gap',
      ],
      dialect: 'uk',
      allowFixtures: true,
    },
    () => 0.5,
  ).questions;
  const s = buildSession(
    {
      profileId: 'p',
      plan: {
        ...plan,
        schedule: { ...plan.schedule, minutesPerSession: 10, newVerbsPerSession: 4 },
      },
      selection: { verbIds: verbs.map((v) => v.id), excludedIds: [], reasons: [] },
      questions,
      progress: [],
      today: '2026-10-29',
    },
    { now: () => '2026-10-29T00:00:00Z' },
    () => 0.5,
  );
  expect(new Set(s.queue.map((q) => q.verbId)).size).toBe(4);
  expect(new Set(s.queue.map((q) => q.skill)).size).toBe(5);
});
