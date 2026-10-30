import { it, expect } from 'vitest';
import { openAppDatabase } from '../persistence/repositories';
import { bootstrap } from '../persistence/bootstrap';
import { dataset } from '../../../tests/fixtures/dataset';
import {
  startSession,
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
