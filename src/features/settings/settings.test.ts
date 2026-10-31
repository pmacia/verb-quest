import { it, expect } from 'vitest';
import { openAppDatabase } from '../persistence/repositories';
import { bootstrap } from '../persistence/bootstrap';
import { dataset } from '../../../tests/fixtures/dataset';
import { updateSettings, resetProgress } from './settings-service';
it('settings persist and reject invalid volume or timezone', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  const p = await bootstrap(r, dataset, { now: () => '2026-10-29T00:00:00Z' });
  await updateSettings(r, p.id, { theme: 'dark', volume: 0.3 });
  expect((await r.settings.get(p.id))?.theme).toBe('dark');
  await expect(updateSettings(r, p.id, { volume: 8 })).rejects.toThrow();
  await expect(updateSettings(r, p.id, { timeZone: 'invalid' })).rejects.toThrow();
  r.close();
});
it('reset deletes sessions and evidence but retains catalog lists and preferences', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  const p = await bootstrap(r, dataset, { now: () => '2026-10-29T00:00:00Z' });
  await r.lists.put({ id: 'l', profileId: p.id, name: 'Examen', verbIds: ['go'] });
  await r.xpLedger.put({
    id: 'x',
    profileId: p.id,
    sessionId: 's',
    points: 10,
    at: '2026-10-29T00:00:00Z',
  });
  await resetProgress(r, p.id);
  expect(await r.xpLedger.count()).toBe(0);
  expect(await r.catalog.count()).toBe(8);
  expect((await r.lists.get('l'))?.name).toBe('Examen');
  expect(await r.settings.get(p.id)).toBeDefined();
  r.close();
});

it('IPA mode defaults off, upgrades legacy preferences and persists an explicit choice', async () => {
  const r = await openAppDatabase(crypto.randomUUID());
  const p = await bootstrap(r, dataset, { now: () => '2026-10-31T00:00:00Z' });
  const settings = (await r.settings.get(p.id))!;
  expect(settings.strictIpa).toBe(false);
  delete settings.strictIpa;
  await r.settings.put(settings);
  await updateSettings(r, p.id, { strictIpa: true });
  expect((await r.settings.get(p.id))?.strictIpa).toBe(true);
  await updateSettings(r, p.id, { strictIpa: false });
  expect((await r.settings.get(p.id))?.strictIpa).toBe(false);
  await expect(
    updateSettings(r, p.id, { strictIpa: 'yes' as unknown as boolean }),
  ).rejects.toThrow();
  r.close();
});
