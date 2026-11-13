import type { SkillProgress, StudyPlan, StudySession, Verb } from '../../shared/domain/types';
import { deriveVisibleState } from '../learning-engine/progress';
import { allSkills, resolvePlanSelection, templates } from '../study-plans/plan-service';

export function progressSummary(verbs: Verb[], progress: SkillProgress[], today: string) {
  const active = verbs.filter((v) => !v.archivedAt);
  const ids = new Set(active.map((v) => v.id));
  const records = progress.filter((p) => ids.has(p.verbId));
  return {
    verbs: active,
    records,
    practicedIds: new Set(
      records
        .filter((p) => p.started || p.stage > 0 || p.objectiveError || p.selfReportReview)
        .map((p) => p.verbId),
    ),
    due: records.filter((p) => deriveVisibleState(p, today) === 'needs_review'),
    mastered: Object.fromEntries(
      allSkills.map((skill) => [
        skill,
        records.filter((p) => p.skill === skill && deriveVisibleState(p, today) === 'mastered')
          .length,
      ]),
    ),
  };
}
export function currentPlanContext(
  context: Parameters<typeof resolvePlanSelection>[1] & {
    plans: StudyPlan[];
    sessions: StudySession[];
  },
) {
  const candidates = context.sessions
    .filter((s) => s.planContext || context.plans.some((p) => p.id === s.planId))
    .toSorted(
      (a, b) =>
        Number(a.status === 'completed') - Number(b.status === 'completed') ||
        b.createdAt.localeCompare(a.createdAt),
    );
  const session = candidates[0];
  if (session?.planContext)
    return {
      ...session.planContext,
      note: 'Selección completa al iniciar el plan, antes del límite diario de verbos nuevos.',
    };
  const plan =
    context.plans.find((p) => p.id === session?.planId) ?? context.plans[0] ?? templates[0];
  return {
    id: plan.id,
    name: plan.name,
    verbIds: resolvePlanSelection(plan, context).verbIds,
    note: session
      ? 'Selección del plan guardado con su configuración actual.'
      : 'Próximo plan de estudio. Todavía no has iniciado una sesión con él.',
  };
}
