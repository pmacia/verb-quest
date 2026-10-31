import type { Verb, CatalogQuery, SkillProgress, VerbList } from '../../shared/domain/types';
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
export const formValues = (v: Verb, form: 'base' | 'pastSimple' | 'pastParticiple') =>
  form === 'base' ? [v.forms.base.value] : v.forms[form].variants.map((x) => x.value);
export interface CatalogContext {
  strictIpa?: boolean;
  lists: Pick<VerbList, 'id' | 'verbIds'>[];
  progress: Partial<SkillProgress>[];
  today: string;
}
export function queryCatalog(
  verbs: Verb[],
  query: CatalogQuery,
  context: CatalogContext,
): { items: Verb[]; total: number } {
  const f = query.filter;
  const text = normalize(query.text);
  const matches = (a: string[] | undefined, b: string[]) =>
    !a?.length || a.some((x) => b.includes(x));
  const progress = (id: string) => context.progress.filter((p) => p.verbId === id);
  const state = (id: string) => {
    const ps = progress(id);
    return !ps.length
      ? 'new'
      : ps.some((p) => (p.dueDate && p.dueDate <= context.today) || p.state === 'needs_review')
        ? 'needs_review'
        : ps.filter((p) => p.state === 'mastered').length === 5
          ? 'mastered'
          : ps.some((p) => p.state === 'consolidating' || p.state === 'mastered')
            ? 'consolidating'
            : 'learning';
  };
  const due = (id: string) =>
    progress(id)
      .map((p) => p.dueDate ?? '9999')
      .sort()[0] ?? '9999';
  const items = verbs
    .filter((v) => !v.archivedAt)
    .filter((v) => {
      const c = v.classification;
      return (
        (!text ||
          normalize(
            [
              v.lemma,
              ...formValues(v, 'pastSimple'),
              ...formValues(v, 'pastParticiple'),
              ...v.meanings,
              ...(v.notes ?? []),
              ...(c.topics ?? []),
            ].join(' '),
          ).includes(text)) &&
        matches(f.courses, c.recommendedCourses) &&
        matches(f.frequencies, [c.frequencyBand]) &&
        matches(f.relations, [c.formRelation]) &&
        matches(f.families, c.patternGroups) &&
        matches(f.topics, c.topics ?? []) &&
        matches(f.states, [state(v.id)]) &&
        (!f.listIds?.length ||
          f.listIds.some((id) => context.lists.find((l) => l.id === id)?.verbIds.includes(v.id))) &&
        (!f.spelling?.length ||
          f.spelling.some((x) =>
            formValues(v, x.form).some((value) => value.endsWith(x.ending.replace(/^-/, ''))),
          )) &&
        (!f.phonetic?.length ||
          f.phonetic.some((x) => {
            if (!x.ending.trim().replace(/^\/|\/$/g, '')) return true;
            const values = x.form === 'base' ? [v.forms.base] : v.forms[x.form].variants;
            return values.some((a) => {
              const p = a.pronunciation?.[x.dialect];
              return (
                (!context.strictIpa || p?.validated) &&
                p?.ipa?.replace(/^\/|\/$/g, '').endsWith(x.ending.trim().replace(/^\/|\/$/g, ''))
              );
            });
          }))
      );
    });
  const freq = ['essential', 'common', 'less_common', 'advanced'];
  const diff = ['introductory', 'intermediate', 'advanced'];
  items.sort((a, b) => {
    let n = 0;
    switch (query.sort) {
      case 'frequency':
        n =
          freq.indexOf(a.classification.frequencyBand) -
          freq.indexOf(b.classification.frequencyBand);
        break;
      case 'course':
        n = (a.classification.recommendedCourses[0] ?? 'z').localeCompare(
          b.classification.recommendedCourses[0] ?? 'z',
        );
        break;
      case 'mastery':
        n =
          ['new', 'needs_review', 'learning', 'consolidating', 'mastered'].indexOf(state(a.id)) -
          ['new', 'needs_review', 'learning', 'consolidating', 'mastered'].indexOf(state(b.id));
        break;
      case 'difficulty':
        n =
          diff.indexOf(a.classification.difficulty ?? 'introductory') -
          diff.indexOf(b.classification.difficulty ?? 'introductory');
        break;
      case 'review':
        n = due(a.id).localeCompare(due(b.id));
    }
    return (
      (n || a.lemma.localeCompare(b.lemma) || a.id.localeCompare(b.id)) *
      (query.direction === 'desc' ? -1 : 1)
    );
  });
  return { items, total: items.length };
}
