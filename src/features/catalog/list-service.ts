import { createId } from '../../shared/identity/create-id';
import type { AppRepositories } from '../persistence/repositories';
import { resolvePlanSelection } from '../study-plans/plan-service';
import { toLocalDate } from '../../shared/time/calendar';
import type { StudyPlan, VerbList } from '../../shared/domain/types';
export async function saveList(
  repos: AppRepositories,
  profileId: string,
  input: { id?: string; name: string; verbIds: string[] },
): Promise<VerbList> {
  if (!input.name.trim()) throw Error('Escribe un nombre para la lista.');
  const list = {
    ...input,
    id: input.id ?? createId(),
    profileId,
    name: input.name.trim(),
    verbIds: [...new Set(input.verbIds)],
  };
  await repos.lists.put(list);
  return list;
}
export async function toggleListVerb(
  repos: AppRepositories,
  profileId: string,
  listId: string,
  verbId: string,
) {
  const l = await repos.lists.get(listId);
  if (!l || l.profileId !== profileId) throw Error('Lista no encontrada');
  return saveList(repos, profileId, {
    ...l,
    verbIds: l.verbIds.includes(verbId)
      ? l.verbIds.filter((id) => id !== verbId)
      : [...l.verbIds, verbId],
  });
}

export function planUsesList(plan: StudyPlan, listId: string): boolean {
  return (
    (plan.source.type === 'saved_list' && plan.source.listId === listId) ||
    (plan.source.type === 'filter' && !!plan.source.filter.listIds?.includes(listId))
  );
}

export async function renameList(
  repos: AppRepositories,
  profileId: string,
  listId: string,
  name: string,
) {
  if (!name.trim()) throw Error('Escribe un nombre para la lista.');
  return repos.runAtomic(async () => {
    const list = await repos.lists.get(listId);
    if (!list || list.profileId !== profileId) throw Error('Lista no encontrada');
    const renamed = { ...list, name: name.trim() };
    await repos.lists.put(renamed);
    return renamed;
  });
}

export async function deleteList(repos: AppRepositories, profileId: string, listId: string) {
  return repos.runAtomic(async () => {
    const list = await repos.lists.get(listId);
    if (!list || list.profileId !== profileId) throw Error('Lista no encontrada');
    const plans = (await repos.plans.where('profileId').equals(profileId).toArray()).filter(
      (plan) => planUsesList(plan, listId),
    );
    if (plans.length) {
      const [entries, lists, progress, settings] = await Promise.all([
        repos.catalog.toArray(),
        repos.lists.where('profileId').equals(profileId).toArray(),
        repos.progress.where('profileId').equals(profileId).toArray(),
        repos.settings.get(profileId),
      ]);
      const now = new Date().toISOString();
      const context = {
        verbs: entries.map((entry) => entry.verb),
        lists,
        progress,
        today: toLocalDate(now, settings?.timeZone ?? 'UTC'),
        strictIpa: settings?.strictIpa,
      };
      for (const plan of plans) {
        const verbIds =
          plan.source.type === 'saved_list'
            ? list.verbIds
            : resolvePlanSelection(plan, context).verbIds;
        await repos.plans.put({ ...plan, source: { type: 'manual', verbIds }, updatedAt: now });
      }
    }
    await repos.lists.delete(listId);
  });
}
