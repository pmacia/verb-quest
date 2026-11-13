import { it, expect } from 'vitest';
import { openAppDatabase } from '../persistence/repositories';
import { bootstrap } from '../persistence/bootstrap';
import { dataset } from '../../../tests/fixtures/dataset';
import {
  startSession,
  replaceSession,
  ActiveSessionError,
  submitAnswer,
  pauseSession,
  resumeSession,
  completeSession,
} from './session-service';
const clock = { now: () => '2026-10-29T12:00:00Z' };
async function setup() {
  const r = await openAppDatabase(crypto.randomUUID());
  const p = await bootstrap(r, dataset, clock);
  const s = await startSession(
    r,
    {
      kind: 'free',
      profileId: p.id,
      verbIds: ['be', 'go', 'take', 'buy', 'write'],
      modes: ['written_recall'],
      skills: ['recall'],
    },
    clock,
    () => 0.5,
  );
  return { r, p, s };
}
function input(s: any, answer?: string) {
  const q = s.queue[s.cursor];
  return {
    attemptId: crypto.randomUUID(),
    sessionId: s.id,
    questionId: q.id,
    answer: answer ?? q.acceptedAnswers[0],
    hintsUsed: false,
    revealed: false,
    at: clock.now(),
  };
}
it('double sends do not duplicate progress or cursor even with different attempt IDs', async () => {
  const { r, s } = await setup();
  expect(s.queue.length).toBeGreaterThan(0);
  const a = input(s);
  await submitAnswer(r, a, clock);
  await submitAnswer(r, a, clock);
  await submitAnswer(r, { ...a, attemptId: crypto.randomUUID() }, clock);
  expect(await r.attempts.count()).toBe(1);
  expect((await r.sessions.get(s.id))?.cursor).toBe(1);
  expect((await r.progress.toArray())[0].stage).toBe(1);
  r.close();
});
it('pause and reload recover the next unanswered snapshot', async () => {
  const { r, p, s } = await setup();
  await submitAnswer(r, input(s), clock);
  await pauseSession(r, s.id);
  const resumed = (await resumeSession(r, p.id))!;
  expect(resumed.cursor).toBe(1);
  expect(resumed.queue[0]).toEqual(s.queue[0]);
  r.close();
});
it('wrong answers retry once without resetting the mission', async () => {
  const { r, s } = await setup();
  await submitAnswer(r, input(s, 'wrong'), clock);
  let next = (await r.sessions.get(s.id))!;
  expect(next.cursor).toBe(1);
  expect(next.queue).toHaveLength(s.queue.length + 1);
  expect(next.queue.at(-1)?.retryOf).toBe(s.queue[0].id);
  next.cursor = next.queue.length - 1;
  await r.sessions.put(next);
  await submitAnswer(r, input(next, 'wrong'), clock);
  expect((await r.sessions.get(s.id))?.queue).toHaveLength(s.queue.length + 1);
  r.close();
});
it('archived pending questions are skipped and history is retained', async () => {
  const { r, p, s } = await setup();
  await submitAnswer(r, input(s), clock);
  const q = s.queue[1];
  const e = (await r.catalog.get(q.verbId))!;
  e.verb.archivedAt = clock.now();
  await r.catalog.put(e);
  const next = (await resumeSession(r, p.id))!;
  expect(next.queue.slice(next.cursor).every((x: any) => x.verbId !== q.verbId)).toBe(true);
  expect(await r.attempts.count()).toBe(1);
  r.close();
});
it('failed transactions do not advance any of the state', async () => {
  const { r, s } = await setup();
  r.progress.hook('creating', () => {
    throw Error('quota');
  });
  await expect(submitAnswer(r, input(s), clock)).rejects.toThrow('quota');
  expect(await r.attempts.count()).toBe(0);
  expect((await r.sessions.get(s.id))?.cursor).toBe(0);
  r.close();
});
it('finalization is idempotent', async () => {
  const { r, s } = await setup();
  const a = await completeSession(r, s.id, clock);
  const b = await completeSession(r, s.id, clock);
  expect(a.session.status).toBe('completed');
  expect(b.session.completedAt).toBe(a.session.completedAt);
  r.close();
});
it('visual fallback records spelling, never listening, and retains a distinct snapshot', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  const p = await bootstrap(r, dataset, clock);
  const s = await startSession(
    r,
    {
      kind: 'free',
      profileId: p.id,
      verbIds: ['go'],
      modes: ['audio_detective'],
      skills: ['listening'],
    },
    clock,
    () => 0.5,
  );
  const result = await submitAnswer(r, { ...input(s), visualFallback: true }, clock);
  expect(result.attempt.skill).toBe('spelling');
  expect(await r.progress.get([p.id, 'go', 'listening'])).toBeUndefined();
  expect(result.attempt.snapshot.mode).toBe('written_recall');
  r.close();
});
import { saveVerb } from '../catalog/editor-service';
import { emptyProgress } from './progress';
it('an old question snapshot cannot credit an edited form', async () => {
  const { r, p, s } = await setup();
  const q = s.queue[0];
  const entry = (await r.catalog.get(q.verbId))!;
  const changed = structuredClone(entry.verb);
  if (q.target === 'base') {
    changed.forms.base.value += '-new';
    changed.lemma += '-new';
  } else
    changed.forms[q.target].variants = changed.forms[q.target].variants.map((v) => ({
      ...v,
      value: v.value + '-new',
    }));
  const saved = await saveVerb(r, changed, entry.verb.contentVersion);
  expect(saved.status).toBe('saved');
  const result = await submitAnswer(r, input(s), clock);
  expect(result.attempt.correct).toBe(true);
  expect(result.attempt.superseded).toBe(true);
  expect(result.progress?.stage).toBe(0);
  expect(await r.attempts.count()).toBe(1);
  r.close();
});
it('translation edits preserve current form evidence and pending snapshots', async () => {
  const { r, p, s } = await setup();
  const first = await submitAnswer(r, input(s), clock);
  const entry = (await r.catalog.get(first.attempt.verbId))!;
  await saveVerb(r, { ...entry.verb, meanings: ['otra traducción'] }, entry.verb.contentVersion);
  expect((await r.progress.get([p.id, first.attempt.verbId, first.attempt.skill]))?.stage).toBe(1);
  const next = (await r.sessions.get(s.id))!;
  const result = await submitAnswer(r, input(next), clock);
  expect(result.attempt.superseded).toBe(false);
  r.close();
});
it('semantic form edits reset active progress while keeping historical attempts', async () => {
  const { r, p, s } = await setup();
  const first = await submitAnswer(r, input(s), clock);
  const entry = (await r.catalog.get(first.attempt.verbId))!;
  const changed = structuredClone(entry.verb);
  changed.forms.pastParticiple.variants[0].value += '-edited';
  await saveVerb(r, changed, entry.verb.contentVersion);
  expect((await r.progress.get([p.id, first.attempt.verbId, first.attempt.skill]))?.stage).toBe(0);
  expect(await r.attempts.count()).toBe(1);
  r.close();
});
it('starts exam from an owned saved list without creating or mutating a personal plan', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  const profile = await bootstrap(r, dataset, clock);
  await r.lists.put({ id: 'exam-list', profileId: profile.id, name: 'Examen', verbIds: ['go'] });
  const session = await startSession(
    r,
    { kind: 'plan', profileId: profile.id, planId: 'template-exam', listId: 'exam-list' },
    clock,
    () => 0.5,
  );
  expect(session.selection).toEqual(['go']);
  expect(session.planContext?.listId).toBe('exam-list');
  expect(session.queue.length).toBeGreaterThan(0);
  expect(session.queue.every((q) => ['recall', 'spelling', 'context'].includes(q.skill))).toBe(
    true,
  );
  expect(await r.plans.count()).toBe(0);
  await completeSession(r, session.id, clock);
  await r.lists.put({ id: 'foreign', profileId: 'other', name: 'Otra', verbIds: ['go'] });
  await expect(
    startSession(
      r,
      { kind: 'plan', profileId: profile.id, planId: 'template-exam', listId: 'foreign' },
      clock,
      () => 0.5,
    ),
  ).rejects.toThrow('este perfil');
  await expect(
    startSession(
      r,
      { kind: 'plan', profileId: profile.id, planId: 'template-zero', listId: 'exam-list' },
      clock,
      () => 0.5,
    ),
  ).rejects.toThrow('solo se admite');
  r.close();
});
it('keeps the full study-plan scope even when the daily session admits only one new verb', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  const profile = await bootstrap(r, dataset, clock);
  const plan = {
    ...(await import('../study-plans/plan-service')).templates[0],
    id: 'small-plan',
    profileId: profile.id,
    isTemplate: false,
    name: 'Tres verbos',
    source: { type: 'manual' as const, verbIds: ['go', 'take', 'buy'] },
    schedule: {
      minutesPerSession: 5 as const,
      newVerbsPerSession: 1,
      remindersEnabled: false as const,
    },
  };
  await r.plans.put(plan);
  const session = await startSession(
    r,
    { kind: 'plan', profileId: profile.id, planId: plan.id },
    clock,
    () => 0.5,
  );
  expect(session.selection).toHaveLength(1);
  expect(session.planContext).toEqual({
    id: 'small-plan',
    name: 'Tres verbos',
    verbIds: ['go', 'take', 'buy'],
  });
  const { exportBackup, previewRestore } = await import('../persistence/backup');
  const backup = await exportBackup(r, profile.id, clock);
  expect(previewRestore(backup).ok).toBe(true);
  expect(backup.sessions[0].planContext?.verbIds).toEqual(['go', 'take', 'buy']);
  r.close();
});
it('preserves the name and difficulty scope of a saved plan when starting a game from it', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  const profile = await bootstrap(r, dataset, clock);
  const { templates } = await import('../study-plans/plan-service');
  await r.plans.put({
    ...templates[0],
    id: 'mine',
    profileId: profile.id,
    name: 'Mi plan básico',
    isTemplate: false,
    difficulty: 'introductory',
    source: { type: 'manual', verbIds: ['go', 'write'] },
  });
  const s = await startSession(
    r,
    {
      kind: 'free',
      profileId: profile.id,
      verbIds: [],
      planId: 'mine',
      modes: ['written_recall'],
      skills: ['recall'],
    },
    clock,
    () => 0.5,
  );
  expect(s.planContext).toEqual({ id: 'mine', name: 'Mi plan básico', verbIds: ['go'] });
  expect(s.queue.every((q) => q.verbId === 'go')).toBe(true);
  r.close();
});

const nextGame = (profileId: string) => ({
  kind: 'free' as const,
  profileId,
  verbIds: ['go'],
  modes: ['flashcards' as const],
  skills: ['recall' as const],
});
it('exposes the pending session without modifying it when another game is requested', async () => {
  const { r, p, s } = await setup();
  try {
    await startSession(r, nextGame(p.id), clock, () => 0.5);
    throw Error('Expected a session conflict');
  } catch (error) {
    expect(error).toBeInstanceOf(ActiveSessionError);
    expect((error as ActiveSessionError).session.id).toBe(s.id);
  }
  expect(await r.sessions.count()).toBe(1);
  expect((await r.sessions.get(s.id))?.status).toBe('active');
  r.close();
});
it('replaces a confirmed paused session while preserving attempts and learning progress', async () => {
  const { r, p, s } = await setup();
  await submitAnswer(r, input(s), clock);
  await pauseSession(r, s.id);
  const progress = await r.progress.toArray();
  const next = await replaceSession(r, nextGame(p.id), s.id, clock, () => 0.5);
  expect((await r.sessions.get(s.id))?.status).toBe('completed');
  expect(next.id).not.toBe(s.id);
  expect(next.status).toBe('active');
  expect(await r.attempts.count()).toBe(1);
  expect(await r.progress.toArray()).toEqual(progress);
  expect(await r.sessions.filter((s) => s.status !== 'completed').count()).toBe(1);
  r.close();
});
it('rolls back completion and rewards if the requested replacement cannot start', async () => {
  const { r, p, s } = await setup();
  await submitAnswer(r, input(s), clock);
  const before = {
    session: await r.sessions.get(s.id),
    progress: await r.progress.toArray(),
    xp: await r.xpLedger.toArray(),
  };
  await expect(
    replaceSession(r, { ...nextGame(p.id), verbIds: [] }, s.id, clock, () => 0.5),
  ).rejects.toThrow('La selección no tiene verbos disponibles');
  expect(await r.sessions.count()).toBe(1);
  expect(await r.sessions.get(s.id)).toEqual(before.session);
  expect(await r.progress.toArray()).toEqual(before.progress);
  expect(await r.xpLedger.toArray()).toEqual(before.xp);
  r.close();
});
it('requires confirmation again if a different session was started in the meantime', async () => {
  const { r, p, s } = await setup();
  await completeSession(r, s.id, clock);
  const newer = await startSession(r, nextGame(p.id), clock, () => 0.5);
  await expect(replaceSession(r, nextGame(p.id), s.id, clock, () => 0.5)).rejects.toBeInstanceOf(
    ActiveSessionError,
  );
  expect((await r.sessions.get(newer.id))?.status).toBe('active');
  expect(await r.sessions.count()).toBe(2);
  r.close();
});
it('cannot close a session belonging to another profile', async () => {
  const { r, s } = await setup();
  await expect(replaceSession(r, nextGame('someone-else'), s.id, clock, () => 0.5)).rejects.toThrow(
    'este perfil',
  );
  expect((await r.sessions.get(s.id))?.status).toBe('active');
  expect(await r.sessions.count()).toBe(1);
  r.close();
});
