import { it, expect } from 'vitest';
import { applyAttempt, emptyProgress, deriveVisibleState } from './progress';
import { defaultLearning } from '../persistence/bootstrap';
import type { Attempt, CoverageTarget } from '../../shared/domain/types';
const targets: CoverageTarget[] = [
  { id: 'base', form: 'base', variantValue: 'go', contextKey: null },
  { id: 'pastSimple', form: 'pastSimple', variantValue: 'went', contextKey: null },
  { id: 'pastParticiple', form: 'pastParticiple', variantValue: 'gone', contextKey: null },
];
import { attempt } from '../../../tests/fixtures/attempt';

it('spaces four advances with required coverage using calendar dates', () => {
  let p = emptyProgress('p', 'go', 'recall');
  for (const [d, t, want] of [
    ['2026-10-29', 'base', '2026-10-30'],
    ['2026-10-30', 'pastSimple', '2026-11-02'],
    ['2026-11-02', 'pastParticiple', '2026-11-09'],
    ['2026-11-09', 'base', '2026-11-23'],
  ]) {
    p = applyAttempt(p, attempt(d, t), targets, defaultLearning);
    expect(p.dueDate).toBe(want);
  }
  expect(p.state).toBe('mastered');
  expect(deriveVisibleState(p, '2026-11-23')).toBe('needs_review');
});
it('four went answers do not demonstrate participle or base mastery', () => {
  let p = emptyProgress('p', 'go', 'recall');
  for (const d of ['2026-10-29', '2026-10-30', '2026-11-02', '2026-11-09'])
    p = applyAttempt(p, attempt(d, 'pastSimple'), targets, defaultLearning);
  expect(p.stage).toBe(4);
  expect(p.state).toBe('consolidating');
});
it('early and same-day practice do not advance or fill coverage', () => {
  let p = applyAttempt(
    emptyProgress('p', 'go', 'recall'),
    attempt('2026-10-29'),
    targets,
    defaultLearning,
  );
  p = applyAttempt(p, attempt('2026-10-29', 'pastSimple'), targets, defaultLearning);
  expect(p.stage).toBe(1);
  expect(p.coverage).toEqual(['base']);
  p = applyAttempt(p, attempt('2026-10-30', 'pastSimple'), targets, defaultLearning);
  p = applyAttempt(p, attempt('2026-10-31', 'pastParticiple'), targets, defaultLearning);
  expect(p.stage).toBe(2);
  expect(p.dueDate).toBe('2026-11-02');
  expect(p.coverage).not.toContain('pastParticiple');
});
it('objective errors reset interval and coverage even after same-day success', () => {
  const p = applyAttempt(
    applyAttempt(
      emptyProgress('p', 'go', 'recall'),
      attempt('2026-10-29'),
      targets,
      defaultLearning,
    ),
    attempt('2026-10-29', 'base', { correct: false }),
    targets,
    defaultLearning,
  );
  expect(p.stage).toBe(0);
  expect(p.coverage).toEqual([]);
  expect(p.state).toBe('needs_review');
  expect(p.dueDate).toBe('2026-10-30');
});
it('hints and self-report do not consolidate and unsure flags refuerzo', () => {
  let p = applyAttempt(
    emptyProgress('p', 'go', 'recall'),
    attempt('2026-10-29', 'base', { assisted: true }),
    targets,
    defaultLearning,
  );
  expect(p.stage).toBe(0);
  p = applyAttempt(
    p,
    attempt('2026-10-30', 'base', {
      correct: null,
      evidenceKind: 'self_report',
      selfRating: 'unsure',
    }),
    targets,
    defaultLearning,
  );
  expect(p.state).toBe('needs_review');
  p = applyAttempt(
    p,
    attempt('2026-10-31', 'base', {
      correct: null,
      evidenceKind: 'self_report',
      selfRating: 'known',
    }),
    targets,
    defaultLearning,
  );
  expect(p.state).toBe('needs_review');
});
it('options can advance recognition but never recall or spelling', () => {
  expect(
    applyAttempt(
      emptyProgress('p', 'go', 'recall'),
      attempt('2026-10-29', 'base', { hasOptions: true, isWritten: false }),
      targets,
      defaultLearning,
    ).stage,
  ).toBe(0);
  expect(
    applyAttempt(
      emptyProgress('p', 'go', 'recognition'),
      attempt('2026-10-29', 'base', { skill: 'recognition', hasOptions: true, isWritten: false }),
      targets,
      defaultLearning,
    ).stage,
  ).toBe(1);
});
it('context requires at least one written evidence and isolated profile identity', () => {
  let p = emptyProgress('p', 'go', 'context');
  for (const d of ['2026-10-29', '2026-10-30', '2026-11-02', '2026-11-09'])
    p = applyAttempt(
      p,
      attempt(d, targets[p.stage % 3].id, { skill: 'context', hasOptions: true, isWritten: false }),
      targets,
      defaultLearning,
    );
  expect(p.state).toBe('consolidating');
  expect(
    applyAttempt(p, attempt('2026-11-23', 'base', { skill: 'context' }), targets, defaultLearning)
      .state,
  ).toBe('mastered');
  expect(
    applyAttempt(
      emptyProgress('other', 'go', 'recall'),
      attempt('2026-10-29'),
      targets,
      defaultLearning,
    ).stage,
  ).toBe(0);
});
it('never masters with three targets that omit a main form', () => {
  const missing = targets.filter((t) => t.form !== 'pastParticiple');
  missing.push({
    id: 'pastSimple:were',
    form: 'pastSimple',
    variantValue: 'were',
    contextKey: 'plural',
  });
  let p = emptyProgress('p', 'go', 'recall');
  for (const [d, t] of [
    ['2026-10-29', 'base'],
    ['2026-10-30', 'pastSimple'],
    ['2026-11-02', 'pastSimple:were'],
    ['2026-11-09', 'base'],
  ])
    p = applyAttempt(p, attempt(d, t), missing, defaultLearning);
  expect(p.state).toBe('consolidating');
});
