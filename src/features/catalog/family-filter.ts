import type { Verb } from '../../shared/domain/types';
import { patternLabel } from './classification-labels';
export type FormRelation = Verb['classification']['formRelation'];
export type RelationScope = FormRelation | '';
const historical = new Set([
  'sin-cambio',
  'formas-diferentes',
  'pasado-y-participio',
  'participio-en',
  'ought',
]);
/** Historical broad tags are retained as fallback for verbs without detailed families. */
export function effectiveFamilies(verb: Verb): string[] {
  const families = [...new Set(verb.classification.patternGroups)];
  const detailed = families.filter((id) => !historical.has(id));
  return detailed.length ? detailed : families.length ? families : [''];
}
export function filterFamilyCandidates(
  verbs: Verb[],
  relation: RelationScope,
  selected: string[] | null,
): Verb[] {
  return verbs.filter(
    (verb) =>
      (!relation || verb.classification.formRelation === relation) &&
      (selected === null || effectiveFamilies(verb).some((id) => selected.includes(id))),
  );
}
export function getFamilyOptions(
  verbs: Verb[],
  relation: RelationScope,
): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const verb of filterFamilyCandidates(verbs, relation, null)) {
    for (const family of effectiveFamilies(verb)) counts.set(family, (counts.get(family) ?? 0) + 1);
  }
  return [...counts]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => familyLabel(a.id).localeCompare(familyLabel(b.id), 'es'));
}
export const familyLabel = (id: string) => (id ? patternLabel(id) : 'Sin familia detallada');
