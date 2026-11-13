import type { StudyPlan, StudySession } from '../../shared/domain/types';
import { planSkills, resolvePlanSelection, templates } from './plan-service';
import { withExamList } from './plan-presentation';
import { progressSummary } from '../progress/progress-model';
export type RecentPlanContext = Parameters<typeof resolvePlanSelection>[1] & {
  plans: StudyPlan[];
  sessions: StudySession[];
};
export interface RecentStudyPlan {
  key: string;
  plan: StudyPlan;
  listId?: string;
  title: string;
  href: string;
  verbIds: string[];
  lastUsedAt: string;
  sessions: number;
  needsList: boolean;
  practiced: number;
  due: number;
  nextReview?: string;
}
export function recentStudyPlans(context: RecentPlanContext): RecentStudyPlan[] {
  const today = context.today ?? new Date().toISOString().slice(0, 10);
  const known = [...context.plans, ...templates];
  const result = new Map<string, RecentStudyPlan>();
  const lastUsed = (session: StudySession) => session.completedAt ?? session.createdAt;
  for (const session of [...context.sessions].sort((a, b) =>
    lastUsed(b).localeCompare(lastUsed(a)),
  )) {
    const id = session.planContext?.id ?? session.planId;
    const plan = known.find((plan) => plan.id === id);
    if (!plan) continue;
    const exam = plan.isTemplate && plan.id === 'template-exam';
    const listId = exam ? session.planContext?.listId : undefined;
    const key = JSON.stringify([plan.id, listId ?? null]);
    const previous = result.get(key);
    if (previous) {
      previous.sessions++;
      continue;
    }
    const list = context.lists.find((list) => list.id === listId);
    const verbIds = resolvePlanSelection(withExamList(plan, listId), context).verbIds;
    const ids = new Set(verbIds);
    const summary = progressSummary(
      context.verbs.filter((verb) => ids.has(verb.id)),
      context.progress,
      today,
    );
    const skills = planSkills(plan);
    const query = new URLSearchParams({ plan: plan.id });
    if (listId) query.set('list', listId);
    result.set(key, {
      key,
      plan,
      listId,
      title: exam
        ? `${plan.name} · ${list?.name ?? (listId ? 'Lista no disponible' : 'Elige la lista')}`
        : plan.name,
      href: `/study?${query}`,
      verbIds,
      lastUsedAt: lastUsed(session),
      sessions: 1,
      needsList: !!exam && !list,
      practiced: summary.practicedIds.size,
      due: summary.due.filter((record) => skills.includes(record.skill)).length,
      nextReview: summary.records
        .filter(
          (record) => skills.includes(record.skill) && record.dueDate && record.dueDate > today,
        )
        .map((record) => record.dueDate!)
        .sort()[0],
    });
  }
  return [...result.values()];
}
