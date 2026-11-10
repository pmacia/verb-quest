import type { VerbDefinition } from '../../shared/domain/types';
/** Equal text shares one student-facing block; source data remains independently editable. */
export function mergeDefinitions(definitions: readonly VerbDefinition[] = []): VerbDefinition[] {
  const groups = new Map<string, VerbDefinition>();
  for (const definition of definitions) {
    const text = definition.text.trim().replace(/\s+/g, ' ');
    if (!text) continue;
    const key = text.toLowerCase();
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        ...structuredClone(definition),
        text,
        dialects: [...definition.dialects].sort(),
      });
      continue;
    }
    existing.dialects = [...new Set([...existing.dialects, ...definition.dialects])].sort();
    for (const source of definition.sources) {
      if (
        !existing.sources.some(
          (s) =>
            s.url === source.url &&
            s.label === source.label &&
            s.checkedAt === source.checkedAt &&
            s.license === source.license,
        )
      )
        existing.sources.push({ ...source });
    }
    if (definition.reviewStatus === 'draft' || existing.reviewStatus === 'draft')
      existing.reviewStatus = 'draft';
    else if (definition.reviewStatus === 'needs_review') existing.reviewStatus = 'needs_review';
  }
  return [...groups.values()];
}
