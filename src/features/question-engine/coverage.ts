import editorialTargets from '../../content/coverage-targets.json';
import type {
  Verb,
  EvaluatedSkill,
  Dialect,
  CoverageTarget,
  FormKey,
} from '../../shared/domain/types';
export function getCoverageTargets(
  verb: Verb,
  _skill: EvaluatedSkill,
  dialect: Dialect,
): CoverageTarget[] {
  const editorial = (editorialTargets as Record<string, Record<Dialect, CoverageTarget[]>>)[
    verb.id
  ];
  if (verb.contentVersion === 'curated-1.0' && editorial?.[dialect])
    return structuredClone(editorial[dialect]);
  return (['base', 'pastSimple', 'pastParticiple'] as FormKey[]).flatMap<CoverageTarget>((form) => {
    if (form === 'base')
      return [{ id: 'base', form, variantValue: verb.forms.base.value, contextKey: null }];
    const variants = verb.forms[form].variants.filter(
      (v) => !v.dialect || v.dialect === 'all' || v.dialect === dialect,
    );
    if (verb.forms.base.value.trim().toLowerCase() === 'be' && form === 'pastSimple')
      return variants.map((v) => ({
        id: `pastSimple:${v.value}`,
        form,
        variantValue: v.value,
        contextKey: v.value === 'was' ? 'singular' : 'plural',
      }));
    return variants.length
      ? [{ id: form, form, variantValue: variants[0].value, contextKey: null }]
      : [];
  });
}
