export interface PracticeTarget {
  verbId: string;
  skill: string;
  dueDate: string | null;
  error: boolean;
  weakness: number;
  isNew: boolean;
}
export function rankPracticeTargets(input: PracticeTarget[], today: string): PracticeTarget[] {
  const rank = (p: PracticeTarget) =>
    p.dueDate && p.dueDate <= today ? 0 : p.error ? 1 : !p.isNew ? 2 : 3;
  return [...input].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
      b.weakness - a.weakness ||
      a.verbId.localeCompare(b.verbId) ||
      a.skill.localeCompare(b.skill),
  );
}
