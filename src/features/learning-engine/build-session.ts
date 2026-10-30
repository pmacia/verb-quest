import { shuffle } from '../question-engine/generate';
import type {
  StudyPlan,
  ResolvedSelection,
  Question,
  SkillProgress,
  Clock,
  StudySession,
} from '../../shared/domain/types';
export function buildSession(
  input: {
    profileId: string;
    plan: StudyPlan;
    selection: ResolvedSelection;
    questions: Question[];
    progress: SkillProgress[];
    today: string;
  },
  clock: Clock,
  rng: () => number,
): StudySession {
  const relevant = input.progress.filter((p) => input.selection.verbIds.includes(p.verbId));
  const ps = (id: string) => relevant.filter((p) => p.verbId === id);
  const date = (id: string) =>
    ps(id)
      .map((p) => p.dueDate ?? '9999')
      .sort()[0] ?? '9999';
  const rank = (id: string) =>
    date(id) <= input.today
      ? 0
      : ps(id).some((p) => p.objectiveError || p.selfReportReview)
        ? 1
        : ps(id).length
          ? 2
          : 3;
  const ids = [...input.selection.verbIds].sort((a, b) =>
    input.plan.order === 'alphabetical'
      ? a.localeCompare(b)
      : rank(a) - rank(b) || date(a).localeCompare(date(b)) || a.localeCompare(b),
  );
  let added = 0;
  const allowed = ids.filter(
    (id) => ps(id).length > 0 || added++ < input.plan.schedule.newVerbsPerSession,
  );
  const skills = ['recall', 'recognition', 'listening', 'spelling', 'context'] as const;
  const pools = allowed.map((id) => {
    const groups = skills.map((skill) =>
      shuffle(
        input.questions.filter((q) => q.verbId === id && q.skill === skill),
        rng,
      ).sort((a, b) => {
        const p = ps(id).find((p) => p.skill === skill);
        return (
          Number(!!p?.coverage.includes(a.coverageTargetIds[0])) -
          Number(!!p?.coverage.includes(b.coverageTargetIds[0]))
        );
      }),
    );
    const mixed: Question[] = [];
    while (groups.some((g) => g.length))
      for (const g of groups) {
        const next = g.shift();
        if (next) mixed.push(next);
      }
    return mixed;
  });
  const queue: Question[] = [];
  while (pools.some((pool) => pool.length))
    for (const pool of pools) {
      const next = pool.shift();
      if (next) queue.push(next);
    }
  // Keep overdue/error evidence ahead of weak/new material without filling a
  // short session with every question for the first verb in the catalog.
  const priority = (q: Question) => {
    const p = ps(q.verbId).find((p) => p.skill === q.skill);
    return p?.dueDate && p.dueDate <= input.today
      ? 0
      : p?.objectiveError || p?.selfReportReview
        ? 1
        : p && p.stage > 0
          ? 2
          : 3;
  };
  if (input.plan.order === 'adaptive')
    queue.sort(
      (a, b) =>
        priority(a) - priority(b) ||
        (priority(a) === 0
          ? (ps(a.verbId).find((p) => p.skill === a.skill)?.dueDate ?? '').localeCompare(
              ps(b.verbId).find((p) => p.skill === b.skill)?.dueDate ?? '',
            )
          : 0),
    );
  const limit = input.plan.schedule.minutesPerSession * 2;
  return {
    id: crypto.randomUUID(),
    profileId: input.profileId,
    planId: input.plan.isTemplate ? null : input.plan.id,
    selection: allowed,
    queue: structuredClone(queue.slice(0, limit)),
    cursor: 0,
    attemptIds: [],
    retriedQuestionIds: [],
    status: 'active',
    createdAt: clock.now(),
    completedAt: null,
  };
}
