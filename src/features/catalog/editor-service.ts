import type { Verb, Clock } from '../../shared/domain/types';
import type { AppRepositories } from '../persistence/repositories';
import { validate } from '../../shared/domain/validation';
import { normalize } from './query';
import { learningRevision } from '../question-engine/revision';
import { emptyProgress } from '../learning-engine/progress';
export async function saveVerb(
  repos: AppRepositories,
  input: Verb,
  expectedVersion: string | null,
  allowDuplicate = false,
) {
  const valid = validate<Verb>('verb', input);
  if (!valid.ok) return { status: 'invalid' as const, issues: valid.issues };
  return repos.runAtomic(async () => {
    const existing = await repos.catalog.get(input.id);
    if (
      (existing && existing.verb.contentVersion !== expectedVersion) ||
      (!existing && expectedVersion !== null)
    )
      return { status: 'conflict' as const, current: existing?.verb };
    const duplicate = (await repos.catalog.toArray()).find(
      (e) => e.verb.id !== input.id && normalize(e.verb.lemma) === normalize(input.lemma),
    );
    if (duplicate && !allowDuplicate)
      return { status: 'duplicate' as const, current: duplicate.verb };
    const verb = {
      ...valid.value,
      contentVersion: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      for (const progress of await repos.progress.where('verbId').equals(verb.id).toArray()) {
        const revision = learningRevision(verb, progress.skill);
        if (revision !== learningRevision(existing.verb, progress.skill)) {
          await repos.progress.put({
            ...emptyProgress(progress.profileId, verb.id, progress.skill),
            coverageVersion: revision,
          });
        }
      }
    }
    await repos.catalog.put({
      verb,
      baseVersion: existing?.baseVersion ?? null,
      locallyModified: true,
      pendingBase: existing?.pendingBase ?? null,
    });
    return { status: 'saved' as const, verb };
  });
}
export async function getArchiveImpact(repos: AppRepositories, verbId: string) {
  return {
    listIds: (await repos.lists.toArray())
      .filter((l) => l.verbIds.includes(verbId))
      .map((l) => l.id),
    planIds: (await repos.plans.toArray())
      .filter(
        (p) =>
          ('verbIds' in p.source && p.source.verbIds.includes(verbId)) ||
          p.source.type === 'filter' ||
          p.source.type === 'course' ||
          p.source.type === 'saved_list',
      )
      .map((p) => p.id),
    sessionIds: (await repos.sessions.toArray())
      .filter((s) => s.status !== 'completed' && s.selection.includes(verbId))
      .map((s) => s.id),
  };
}
export async function archiveVerb(repos: AppRepositories, verbId: string, clock: Clock) {
  await repos.runAtomic(async () => {
    const e = await repos.catalog.get(verbId);
    if (!e) throw Error('Verbo no encontrado');
    e.verb.archivedAt = clock.now();
    e.locallyModified = true;
    await repos.catalog.put(e);
  });
}
export async function restoreVerb(repos: AppRepositories, verbId: string) {
  const e = await repos.catalog.get(verbId);
  if (!e) throw Error('Verbo no encontrado');
  e.verb.archivedAt = null;
  e.locallyModified = true;
  await repos.catalog.put(e);
}
export async function resolveSeedConflict(
  repos: AppRepositories,
  verbId: string,
  choice: 'keep_local' | 'accept_base',
) {
  const e = await repos.catalog.get(verbId);
  if (!e?.pendingBase) return;
  const version = (await repos.meta.get('datasetVersion'))?.value ?? null;
  if (choice === 'accept_base') {
    e.verb = e.pendingBase;
    e.locallyModified = false;
  }
  e.pendingBase = null;
  e.baseVersion = version;
  await repos.catalog.put(e);
}
