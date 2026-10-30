import type { CatalogEntry, Dataset } from '../../shared/domain/types';
export function reconcileSeed(
  existing: CatalogEntry[],
  seed: Dataset,
): { entries: CatalogEntry[]; conflicts: string[] } {
  const byId = new Map(existing.map((e) => [e.verb.id, structuredClone(e)]));
  const conflicts: string[] = [];
  for (const verb of seed.verbs) {
    const old = byId.get(verb.id);
    if (!old) {
      byId.set(verb.id, {
        verb,
        baseVersion: seed.version,
        locallyModified: false,
        pendingBase: null,
      });
      continue;
    }
    if (old.baseVersion === seed.version) continue;
    if (old.locallyModified) {
      old.pendingBase = verb;
      conflicts.push(verb.id);
    } else
      byId.set(verb.id, {
        verb,
        baseVersion: seed.version,
        locallyModified: false,
        pendingBase: null,
      });
  }
  return { entries: [...byId.values()], conflicts };
}
