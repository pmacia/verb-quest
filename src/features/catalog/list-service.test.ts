import { it, expect } from 'vitest';
import { openAppDatabase } from '../persistence/repositories';
import { dataset } from '../../../tests/fixtures/dataset';
import { deleteList, renameList, saveList } from './list-service';
import type { StudyPlan } from '../../shared/domain/types';

it('renames only the name and protects another profile list', async () => {
  const db = await openAppDatabase(crypto.randomUUID());
  const list = await saveList(db, 'p', { name: 'Original', verbIds: ['go', 'be'] });
  await renameList(db, 'p', list.id, '  Renombrada  ');
  expect(await db.lists.get(list.id)).toEqual({ ...list, name: 'Renombrada' });
  await expect(renameList(db, 'other', list.id, 'No')).rejects.toThrow('Lista no encontrada');
  await expect(deleteList(db, 'other', list.id)).rejects.toThrow('Lista no encontrada');
  expect(await db.lists.get(list.id)).toBeDefined();
  db.close();
});

it('deletes the list while preserving verbs, sessions and dependent plan selection', async () => {
  const db = await openAppDatabase(crypto.randomUUID());
  await db.catalog.bulkPut(
    dataset.verbs.map((verb) => ({
      verb,
      baseVersion: 'test',
      locallyModified: false,
      pendingBase: null,
    })),
  );
  const list = await saveList(db, 'p', { name: 'Examen', verbIds: ['go', 'be'] });
  const plan: StudyPlan = {
    id: 'plan',
    profileId: 'p',
    name: 'Mi plan',
    source: { type: 'saved_list', listId: list.id },
    goals: ['learn'],
    schedule: { minutesPerSession: 5, newVerbsPerSession: 1, remindersEnabled: false },
    questionModes: ['quiz'],
    order: 'alphabetical',
    difficulty: 'all',
    selectionPolicy: 'resolve_at_start',
    createdAt: '2026-11-01T00:00:00Z',
  };
  await db.plans.put(plan);
  await db.plans.put({
    ...plan,
    id: 'filtered',
    source: { type: 'filter', filter: { listIds: [list.id], relations: ['all_different'] } },
  });
  await db.plans.put({ ...plan, id: 'other', profileId: 'other' });
  await deleteList(db, 'p', list.id);
  expect(await db.lists.get(list.id)).toBeUndefined();
  expect((await db.plans.get('plan'))?.source).toEqual({ type: 'manual', verbIds: ['go', 'be'] });
  expect((await db.plans.get('filtered'))?.source).toEqual({ type: 'manual', verbIds: ['go'] });
  expect((await db.plans.get('other'))?.source).toEqual(plan.source);
  expect(await db.catalog.count()).toBe(dataset.verbs.length);
  expect(await db.sessions.count()).toBe(0);
  db.close();
});
