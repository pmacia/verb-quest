import { expect, it } from 'vitest';
import { openAppDatabase } from '../persistence/repositories';
import { bootstrap } from '../persistence/bootstrap';
import { dataset } from '../../../tests/fixtures/dataset';
import { startSession, submitAnswer, pauseSession, resumeSession } from './session-service';
const clock = { now: () => '2026-11-13T12:00:00Z' };
async function setup(ids = ['buy'], language: 'es' | 'en' = 'es') {
  const r = await openAppDatabase(crypto.randomUUID());
  const p = await bootstrap(r, dataset, clock);
  const s = await startSession(
    r,
    {
      kind: 'free',
      profileId: p.id,
      verbIds: ids,
      modes: ['verb_review'],
      skills: ['recall'],
      reviewLanguage: language,
    } as any,
    clock,
    () => 0.5,
  );
  return { r, p, s };
}
const response = (s: any, answer: string[], extra = {}) => ({
  sessionId: s.id,
  questionId: s.queue[s.cursor].id,
  attemptId: crypto.randomUUID(),
  answer,
  hintsUsed: false,
  revealed: false,
  at: clock.now(),
  ...extra,
});
it('includes every selected verb in a standalone review', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  const p = await bootstrap(r, dataset, clock);
  const entry = (await r.catalog.get('buy'))!;
  const ids = Array.from({ length: 60 }, (_, i) => `buy-${i}`);
  await r.catalog.bulkPut(ids.map((id) => ({ ...entry, verb: { ...entry.verb, id } })));
  const s = await startSession(
    r,
    { kind: 'free', profileId: p.id, verbIds: ids, modes: ['verb_review'], skills: ['recall'] },
    clock,
    () => 0.5,
  );
  expect(s.queue).toHaveLength(60);
  expect(new Set(s.queue.map((q) => q.verbId)).size).toBe(60);
  r.close();
});
it('retries errors after pending questions and keeps retrying until solved', async () => {
  const { r, s } = await setup();
  let current = s;
  for (let i = 0; i < 3; i++) {
    await submitAnswer(r, response(current, ['buy', 'buy', 'buy']), clock);
    current = (await r.sessions.get(s.id))!;
    expect(current.queue.length).toBe(i + 2);
    expect(current.queue[current.cursor].retryOf).toBe(s.queue[0].id);
  }
  await submitAnswer(r, response(current, ['buy', 'bought', 'bought']), clock);
  const done = (await r.sessions.get(s.id))!;
  expect(done.cursor).toBe(done.queue.length);
  expect((await r.attempts.toArray()).at(-1)?.assisted).toBe(true);
  r.close();
});
it('does not record a voice discrepancy without confirmation', async () => {
  const { r, s } = await setup();
  await expect(
    submitAnswer(r, response(s, ['buy', 'buy', 'buy'], { inputMethod: 'voice' }), clock),
  ).rejects.toThrow('Revisa');
  expect(await r.attempts.count()).toBe(0);
  expect((await r.sessions.get(s.id))?.cursor).toBe(0);
  r.close();
});
it('credits clear spoken recall without crediting spelling or pronunciation', async () => {
  const { r, s } = await setup();
  await submitAnswer(r, response(s, ['by', 'bought', 'bought'], { inputMethod: 'voice' }), clock);
  const records = await r.progress.toArray();
  expect(records).toHaveLength(1);
  expect(records[0].skill).toBe('recall');
  expect(records[0].stage).toBe(1);
  expect((await r.attempts.toArray())[0].isWritten).toBe(false);
  r.close();
});
it('does not credit the visible base form from an English prompt', async () => {
  const { r, s } = await setup(['buy'], 'en');
  await submitAnswer(r, response(s, ['buy', 'bought', 'bought']), clock);
  expect((await r.progress.toArray())[0].coverage).toEqual(['pastSimple', 'pastParticiple']);
  await pauseSession(r, s.id);
  expect((await resumeSession(r, s.profileId))?.queue[0].review?.language).toBe('en');
  r.close();
});

it('persists paused drafts, ignores stale drafts and places a retry after three pending questions', async () => {
  const { r, s } = await setup(['buy', 'go', 'take', 'be', 'write']);
  const { saveReviewDraft } = await import('./session-service');
  const draft = {
    questionId: s.queue[0].id,
    values: ['draft', '', ''],
    inputMethod: 'voice' as const,
    assisted: false,
    fieldMethods: ['voice' as const, 'keyboard' as const, 'keyboard' as const],
  };
  await saveReviewDraft(r, s.id, draft);
  await pauseSession(r, s.id);
  expect((await resumeSession(r, s.profileId))?.reviewDraft).toEqual(draft);
  await submitAnswer(r, response(s, ['wrong', 'wrong', 'wrong']), clock);
  const next = (await r.sessions.get(s.id))!;
  expect(next.queue[4].retryOf).toBe(s.queue[0].id);
  expect(next.reviewDraft).toBeUndefined();
  await saveReviewDraft(r, s.id, draft);
  expect((await r.sessions.get(s.id))?.reviewDraft).toBeUndefined();
  r.close();
});
it('review question snapshots, drafts and voice preferences survive a full backup restore', async () => {
  const { r, p, s } = await setup();
  const { saveReviewDraft } = await import('./session-service');
  const { exportBackup, previewRestore, restoreBackup } = await import('../persistence/backup');
  await saveReviewDraft(r, s.id, {
    questionId: s.queue[0].id,
    values: ['buy', '', ''],
    inputMethod: 'voice',
    assisted: false,
    fieldMethods: ['voice', 'keyboard', 'keyboard'],
  });
  const backup = await exportBackup(r, p.id, clock);
  expect(previewRestore(backup).ok).toBe(true);
  const target = await openAppDatabase(crypto.randomUUID());
  await restoreBackup(target, backup, 'replace_local_profile');
  expect((await target.sessions.get(s.id))?.reviewDraft?.values).toEqual(['buy', '', '']);
  expect((await target.sessions.get(s.id))?.queue[0].review?.dialect).toBe('uk');
  expect((await target.settings.get(p.id))?.reviewCheck).toBe('automatic');
  await submitAnswer(
    r,
    response(s, ['by', 'bought', 'bought'], {
      inputMethod: 'voice',
      fieldMethods: ['voice', 'voice', 'voice'],
    }),
    clock,
  );
  expect(previewRestore(await exportBackup(r, p.id, clock)).ok).toBe(true);
  target.close();
  r.close();
});
