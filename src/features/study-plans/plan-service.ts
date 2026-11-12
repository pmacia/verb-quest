import type {
  StudyPlan,
  ResolvedSelection,
  Verb,
  VerbList,
  SkillProgress,
  EvaluatedSkill,
  ValidationIssue,
  PlanSource,
} from '../../shared/domain/types';
import type { AppRepositories } from '../persistence/repositories';
import { queryCatalog } from '../catalog/query';
import { validate } from '../../shared/domain/validation';
import type { QuestionGenerationResult } from '../question-engine/generate';
export const allSkills: EvaluatedSkill[] = [
  'recognition',
  'recall',
  'listening',
  'spelling',
  'context',
];
export function planSkills(p: StudyPlan): EvaluatedSkill[] {
  if (p.goals.some((g) => ['learn', 'review', 'mixed'].includes(g))) return allSkills;
  return p.goals.filter((g) => allSkills.includes(g as EvaluatedSkill)) as EvaluatedSkill[];
}
export { templates } from './plan-templates';
export function resolvePlanSelection(
  plan: StudyPlan,
  context: {
    verbs: Verb[];
    lists: VerbList[];
    progress: SkillProgress[];
    today?: string;
    strictIpa?: boolean;
  },
): ResolvedSelection {
  const s = plan.source;
  let candidates: string[];
  if (s.type === 'saved_list')
    candidates = context.lists.find((l) => l.id === s.listId)?.verbIds ?? [];
  else if (s.type === 'manual' || s.type === 'imported') candidates = s.verbIds;
  else {
    const filter = s.type === 'course' ? { courses: [s.course] } : s.filter;
    candidates = queryCatalog(
      context.verbs,
      { text: '', filter, sort: 'alphabetical', direction: 'asc' },
      {
        strictIpa: context.strictIpa,
        lists: context.lists,
        progress: context.progress,
        today: context.today ?? new Date().toISOString().slice(0, 10),
      },
    ).items.map((v) => v.id);
  }
  const verbIds = [...new Set(candidates)].filter((id) => {
    const v = context.verbs.find((v) => v.id === id);
    return (
      v &&
      !v.archivedAt &&
      (plan.difficulty === 'all' || v.classification.difficulty === plan.difficulty)
    );
  });
  const excludedIds = candidates.filter((id) => !verbIds.includes(id));
  return {
    verbIds,
    excludedIds,
    reasons: excludedIds.length
      ? [`${excludedIds.length} verbos no disponibles o fuera de la dificultad elegida.`]
      : [],
  };
}
export function validatePlanCompatibility(
  plan: StudyPlan,
  available: QuestionGenerationResult,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const skill of planSkills(plan))
    if (!available.questions.some((q) => q.skill === skill))
      issues.push({
        path: '/goals',
        code: 'unavailable',
        message: `No hay actividades aptas para ${skill}. Cambia la selección o las modalidades.`,
      });
  if (plan.goals.includes('pronunciation'))
    issues.push({
      path: '/goals',
      code: 'unavailable',
      message: 'La pronunciación no se evalúa en esta versión.',
    });
  return issues;
}
export async function savePlan(repos: AppRepositories, plan: StudyPlan) {
  const r = validate<StudyPlan>('plan', plan);
  if (!r.ok) throw Error(r.issues.map((i) => i.message).join(' · '));
  await repos.plans.put(r.value);
}
