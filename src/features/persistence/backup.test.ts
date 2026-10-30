import { it, expect } from 'vitest';
import { exportBackup, previewRestore, restoreBackup } from './backup';
import { openAppDatabase } from './repositories';
import { bootstrap } from './bootstrap';
import { dataset } from '../../../tests/fixtures/dataset';
it('backup restores a profile and its linked content atomically', async () => {
  const a = await openAppDatabase(crypto.randomUUID());
  const p = await bootstrap(a, dataset, { now: () => '2026-10-29T00:00:00Z' });
  await a.lists.put({ id: 'l', profileId: p.id, name: 'Prueba', verbIds: ['go'] });
  const b = await exportBackup(a, p.id, { now: () => '2026-10-29T00:00:00Z' });
  expect(b.format).toBe('verbquest-backup');
  expect(previewRestore(b).ok).toBe(true);
  const other = await openAppDatabase(crypto.randomUUID());
  await restoreBackup(other, b, 'replace_local_profile');
  expect((await other.lists.get('l'))?.verbIds).toEqual(['go']);
  expect((await other.profiles.toArray())[0].id).toBe(p.id);
  a.close();
  other.close();
});
it('rejects incomplete future backups and broken references', () => {
  expect(previewRestore({ schemaVersion: 99 }).ok).toBe(false);
  expect(
    previewRestore({
      format: 'verbquest-backup',
      schemaVersion: 1,
      profile: { id: 'p' },
      settings: {},
      verbs: [],
      lists: [{ id: 'l', profileId: 'p', verbIds: ['missing'] }],
      plans: [],
      sessions: [],
      attempts: [],
      progress: [],
      awards: [],
      xpLedger: [],
      exportedAt: '2026-10-29T00:00:00Z',
      baseDatasetVersion: '1',
    }).ok,
  ).toBe(false);
});
it('rejects out-of-range settings and malformed session snapshots before restoring', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  const p = await bootstrap(r, dataset, { now: () => '2026-10-29T00:00:00Z' });
  const b = await exportBackup(r, p.id, { now: () => '2026-10-29T00:00:00Z' });
  expect(previewRestore({ ...b, settings: { ...b.settings, rate: 100 } }).ok).toBe(false);
  expect(
    previewRestore({
      ...b,
      sessions: [{ id: 'bad', profileId: p.id, queue: [{ verbId: 'go' }], cursor: 0 }],
    }).ok,
  ).toBe(false);
  r.close();
});
import { startSession, submitAnswer } from '../learning-engine/session-service';
it('matching snapshots and semantic coverage survive a full backup round trip', async () => {
  const clock = { now: () => '2026-10-30T12:00:00Z' };
  const r = await openAppDatabase(crypto.randomUUID());
  const p = await bootstrap(r, dataset, clock);
  const session = await startSession(
    r,
    {
      kind: 'free',
      profileId: p.id,
      verbIds: ['be'],
      modes: ['matching'],
      skills: ['recognition'],
    },
    clock,
    () => 0.5,
  );
  const q = session.queue[0];
  const result = await submitAnswer(
    r,
    {
      attemptId: 'matching-attempt',
      sessionId: session.id,
      questionId: q.id,
      answer: q.matchingPairs!.map((pair) => JSON.stringify([pair.id, pair.right])),
      hintsUsed: false,
      revealed: false,
      at: clock.now(),
    },
    clock,
  );
  expect(result.attempt.correct).toBe(true);
  expect(result.progress?.coverage).toHaveLength(4);
  const backup = await exportBackup(r, p.id, clock);
  expect(previewRestore(backup)).toMatchObject({ ok: true });
  const destination = await openAppDatabase(crypto.randomUUID());
  await restoreBackup(destination, backup, 'replace_local_profile');
  expect((await destination.sessions.get(session.id))?.queue[0]).toEqual(q);
  expect((await destination.progress.toArray())[0]).toEqual(result.progress);
  destination.close();
  r.close();
});
