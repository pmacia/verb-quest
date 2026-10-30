import { it, expect } from 'vitest';
import { computeXp, finishSessionXp } from './xp';
import { computeAwards } from './awards';
import { attempt } from '../../../tests/fixtures/attempt';
const a = attempt('2026-10-29');
const session = { id: 's', profileId: 'p', completedAt: '2026-10-29T12:00:00Z' } as any;
it('objective useful answers reward points once for each session target', () => {
  const first = computeXp({ attempt: a, session, ledger: [] });
  expect(first[0]?.points).toBe(10);
  expect(computeXp({ attempt: { ...a, attemptId: 'other' }, session, ledger: first })).toEqual([]);
  expect(computeXp({ attempt: { ...a, assisted: true }, session, ledger: [] })[0]?.points).toBe(5);
  expect(computeXp({ attempt: { ...a, revealed: true }, session, ledger: [] })).toEqual([]);
  expect(
    computeXp({
      attempt: { ...a, evidenceKind: 'self_report', correct: null },
      session,
      ledger: [],
    }),
  ).toEqual([]);
});
it('session bonus requires objective evidence and is idempotent', () => {
  expect(finishSessionXp(session, [], [])).toBeNull();
  const bonus = finishSessionXp(session, [], [a]);
  expect(bonus?.points).toBe(20);
  if (!bonus) throw Error('Missing bonus');
  expect(finishSessionXp(session, [bonus], [a])).toBeNull();
});
it('activity and mastery awards stay separate and do not duplicate', () => {
  const first = computeAwards({
    previous: [],
    next: [],
    activity: [{ kind: 'opened', profileId: 'p', verbId: 'go', at: a.at }],
    existing: [],
  });
  expect(first[0]?.kind).toBe('explorer');
  expect(
    computeAwards({
      previous: [],
      next: [],
      activity: [{ kind: 'opened', profileId: 'p', verbId: 'go', at: a.at }],
      existing: first,
    }),
  ).toEqual([]);
  expect(
    computeAwards({
      previous: [],
      next: [],
      activity: [{ kind: 'audio_failed', profileId: 'p', verbId: 'go', at: a.at }],
      existing: [],
    }),
  ).toEqual([]);
});
it('obsolete snapshots do not award answer XP or a completion bonus', () => {
  const obsolete = { ...a, superseded: true };
  expect(computeXp({ attempt: obsolete, session, ledger: [] })).toEqual([]);
  expect(finishSessionXp(session, [], [obsolete])).toBeNull();
});
