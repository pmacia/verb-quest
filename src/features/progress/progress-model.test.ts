import { expect, it } from 'vitest';
import { dataset } from '../../../tests/fixtures/dataset';
import { emptyProgress } from '../learning-engine/progress';
import { templates } from '../study-plans/plan-service';
import type { StudySession } from '../../shared/domain/types';
import { progressSummary, currentPlanContext } from './progress-model';
const today = '2026-11-13';
it('counts attempted verbs including errors, but counts reviews by skill', () => {
  const records = [
    { ...emptyProgress('p', 'go', 'recall'), started: true, objectiveError: true },
    { ...emptyProgress('p', 'go', 'spelling'), started: true, dueDate: today },
    { ...emptyProgress('p', 'take', 'recall'), started: true, stage: 1 as const },
    emptyProgress('p', 'buy', 'recall'),
  ];
  const summary = progressSummary(dataset.verbs, records, today);
  expect(summary.practicedIds).toEqual(new Set(['go', 'take']));
  expect(summary.due).toHaveLength(2);
  const scoped = progressSummary(
    dataset.verbs.filter((v) => v.id === 'take'),
    records,
    today,
  );
  expect(scoped.practicedIds).toEqual(new Set(['take']));
  expect(scoped.due).toHaveLength(0);
});
it('keeps archived mastery out of both sides of a chart', () => {
  const verbs = dataset.verbs.map((v) =>
    v.id === 'go' ? { ...v, archivedAt: '2026-11-01T00:00:00Z' } : v,
  );
  const records = [
    { ...emptyProgress('p', 'go', 'recall'), started: true, state: 'mastered' as const },
  ];
  const summary = progressSummary(verbs, records, today);
  expect(summary.mastered.recall).toBe(0);
  expect(summary.practicedIds.size).toBe(0);
});
it('uses the full latest study plan scope, not daily limits or later free games', () => {
  const session = (extra: Partial<StudySession>): StudySession => ({
    id: 's',
    profileId: 'p',
    planId: null,
    selection: ['go'],
    queue: [],
    cursor: 0,
    attemptIds: [],
    retriedQuestionIds: [],
    status: 'completed',
    createdAt: '2026-11-12T10:00:00Z',
    completedAt: null,
    ...extra,
  });
  const context = currentPlanContext({
    verbs: dataset.verbs,
    lists: [],
    progress: [],
    plans: [],
    today,
    sessions: [
      session({ createdAt: '2026-11-13T10:00:00Z' }),
      session({
        planContext: {
          id: 'template-exam',
          name: 'Examen · mi lista',
          verbIds: ['go', 'take', 'buy'],
        },
      }),
    ],
  });
  expect(context.name).toBe('Examen · mi lista');
  expect(context.verbIds).toEqual(['go', 'take', 'buy']);
});
it('resolves older personal-plan sessions and offers the next plan before any sessions', () => {
  const plan = {
    ...templates[0],
    id: 'mine',
    isTemplate: false,
    source: { type: 'manual' as const, verbIds: ['go', 'take'] },
  };
  const context = {
    verbs: dataset.verbs,
    lists: [],
    progress: [],
    plans: [plan],
    sessions: [],
    today,
  };
  expect(currentPlanContext(context).verbIds).toEqual(['go', 'take']);
});
