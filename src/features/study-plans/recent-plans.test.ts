import { expect, it } from 'vitest';
import { dataset } from '../../../tests/fixtures/dataset';
import { emptyProgress } from '../learning-engine/progress';
import { templates } from './plan-service';
import { recentStudyPlans } from './recent-plans';
import type { StudySession } from '../../shared/domain/types';
const session = (
  id: string,
  planId: string | null,
  at: string,
  extra: Partial<StudySession> = {},
): StudySession => ({
  id,
  planId,
  profileId: 'p',
  selection: ['go'],
  queue: [],
  cursor: 0,
  attemptIds: ['a'],
  retriedQuestionIds: [],
  status: 'completed',
  createdAt: at,
  completedAt: at,
  ...extra,
});
const context = {
  verbs: dataset.verbs,
  lists: [],
  progress: [],
  today: '2026-11-13',
  plans: [],
  sessions: [] as StudySession[],
};
it('orders recent plans by their latest session without duplicating them or including unrelated free games', () => {
  const result = recentStudyPlans({
    ...context,
    sessions: [
      session('a', null, '2026-11-11T12:00:00Z', {
        planContext: { id: 'template-zero', name: 'Old label', verbIds: ['go'] },
      }),
      session('b', null, '2026-11-12T12:00:00Z', {
        planContext: { id: 'template-context', name: 'Context', verbIds: ['go'] },
      }),
      session('c', null, '2026-11-13T12:00:00Z', {
        planContext: { id: 'template-zero', name: 'Old label', verbIds: ['go'] },
      }),
      session('free', null, '2026-11-13T13:00:00Z'),
    ],
  });
  expect(result.map((p) => p.plan.id)).toEqual(['template-zero', 'template-context']);
  expect(result[0].plan.name).toBe('Empiezo desde cero');
  expect(result[0].sessions).toBe(2);
  expect(result[0].href).toBe('/study?plan=template-zero');
});
it('supports old personal sessions and uses the current saved plan definition', () => {
  const plan = {
    ...templates[0],
    id: 'mine',
    name: 'Renamed plan',
    isTemplate: false,
    source: { type: 'manual' as const, verbIds: ['go', 'take'] },
  };
  const result = recentStudyPlans({
    ...context,
    plans: [plan],
    sessions: [session('a', 'mine', '2026-11-12T12:00:00Z')],
  });
  expect(result[0].title).toBe('Renamed plan');
  expect(result[0].verbIds).toEqual(['go', 'take']);
});
it('keeps different exam lists distinct and never substitutes a missing list', () => {
  const result = recentStudyPlans({
    ...context,
    lists: [{ id: 'list-a', profileId: 'p', name: 'Examen A', verbIds: ['go'] }],
    sessions: [
      session('a', null, '2026-11-12T12:00:00Z', {
        planContext: { id: 'template-exam', name: 'Exam', listId: 'list-a', verbIds: ['go'] },
      }),
      session('b', null, '2026-11-13T12:00:00Z', {
        planContext: { id: 'template-exam', name: 'Exam', listId: 'missing', verbIds: ['take'] },
      }),
    ],
  });
  expect(result).toHaveLength(2);
  expect(result[0].needsList).toBe(true);
  expect(result[0].verbIds).toEqual([]);
  expect(result[0].href).toBe('/study?plan=template-exam&list=missing');
  expect(result[1].title).toContain('Examen A');
  expect(result[1].verbIds).toEqual(['go']);
  expect(result[1].href).toBe('/study?plan=template-exam&list=list-a');
});
it('does not invent a prepared plan for legacy free sessions or resurrect deleted personal plans', () => {
  const result = recentStudyPlans({
    ...context,
    sessions: [
      session('old', null, '2026-11-12T12:00:00Z'),
      session('deleted', 'gone', '2026-11-13T12:00:00Z', {
        planContext: { id: 'gone', name: 'Deleted plan', verbIds: ['go'] },
      }),
    ],
  });
  expect(result).toEqual([]);
});

it('counts only reviews relevant to the plan and keeps the next scheduled date', () => {
  const plan = {
    ...templates.find((p) => p.id === 'template-audio')!,
    id: 'listening-plan',
    isTemplate: false,
    source: { type: 'manual' as const, verbIds: ['go'] },
  };
  const result = recentStudyPlans({
    ...context,
    plans: [plan],
    progress: [
      { ...emptyProgress('p', 'go', 'listening'), started: true, dueDate: '2026-11-14' },
      { ...emptyProgress('p', 'go', 'spelling'), started: true, objectiveError: true },
      { ...emptyProgress('p', 'take', 'listening'), started: true, objectiveError: true },
    ],
    sessions: [session('a', plan.id, '2026-11-13T12:00:00Z')],
  });
  expect(result[0].practiced).toBe(1);
  expect(result[0].due).toBe(0);
  expect(result[0].nextReview).toBe('2026-11-14');
});
