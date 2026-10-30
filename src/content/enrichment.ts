import type { Verb, FormKey, Dialect, Pronunciation } from '../shared/domain/types';
export interface VerbEnrichment {
  id: string;
  patternGroups: string[];
  topics: string[];
  forms: Record<
    FormKey,
    { value: string; pronunciation: Partial<Record<Dialect, Pronunciation>> }[]
  >;
}
export interface ReviewedPronunciation {
  verbId: string;
  form: FormKey;
  value: string;
  dialect: Dialect;
  ipa: string;
  source: string;
  checkedAt: string;
}
const unique = (values: string[]) => [...new Set(values)];
export function compatiblePattern(verb: Verb, pattern: string): boolean {
  if (pattern === 'Especial_Supletivo') return verb.lemma === 'go';
  if (pattern === 'Especial') return ['be', 'do'].includes(verb.lemma);
  if (pattern === 'mixed_regular_ABC') return verb.lemma === 'show';
  if (pattern === 'ABB_UK_/_ABC_US') return verb.lemma === 'get';
  const shape = pattern.match(/^([ABC]{3})(?:_|$)/)?.[1];
  if (!shape) return false;
  const forms = [
    verb.forms.base.value,
    verb.forms.pastSimple.variants[0]?.value,
    verb.forms.pastParticiple.variants[0]?.value,
  ];
  if (forms.some((f) => !f)) return false;
  const values = unique(forms as string[]);
  return forms.map((f) => String.fromCharCode(65 + values.indexOf(f!))).join('') === shape;
}
export function enrichVerbs(
  verbs: Verb[],
  entries: VerbEnrichment[],
  reviewed: ReviewedPronunciation[],
): Verb[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return structuredClone(verbs).map((v) => {
    const entry = byId.get(v.id);
    if (!entry) return v;
    v.classification.patternGroups = unique([
      ...v.classification.patternGroups,
      ...entry.patternGroups.filter((p) => compatiblePattern(v, p)),
    ]);
    v.classification.topics = unique([...(v.classification.topics ?? []), ...entry.topics]);
    for (const form of ['base', 'pastSimple', 'pastParticiple'] as const) {
      const targets = form === 'base' ? [v.forms.base] : v.forms[form].variants;
      for (const target of targets) {
        const incoming = entry.forms[form].find((f) => f.value === target.value);
        if (!incoming) continue;
        for (const dialect of ['uk', 'us'] as const) {
          const candidate = incoming.pronunciation[dialect];
          // A combined transcription cannot be assigned to individual variants by guessing.
          if (
            !candidate?.ipa ||
            !/^\/[^/]+\/$/.test(candidate.ipa) ||
            target.pronunciation?.[dialect]?.validated
          )
            continue;
          const checked = reviewed.some(
            (r) =>
              r.verbId === v.id &&
              r.form === form &&
              r.value === target.value &&
              r.dialect === dialect &&
              r.ipa === candidate.ipa &&
              /^https:\/\//.test(r.source) &&
              !!r.checkedAt,
          );
          target.pronunciation = {
            ...target.pronunciation,
            [dialect]: { ipa: candidate.ipa, validated: checked },
          };
        }
      }
    }
    return v;
  });
}
