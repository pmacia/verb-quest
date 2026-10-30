import type { AppRepositories } from '../persistence/repositories';
import type { VerbList } from '../../shared/domain/types';
export async function saveList(
  repos: AppRepositories,
  profileId: string,
  input: { id?: string; name: string; verbIds: string[] },
): Promise<VerbList> {
  if (!input.name.trim()) throw Error('Escribe un nombre para la lista.');
  const list = {
    ...input,
    id: input.id ?? crypto.randomUUID(),
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
