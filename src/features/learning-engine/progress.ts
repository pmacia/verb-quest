import type {
  SkillProgress,
  Attempt,
  CoverageTarget,
  LearningConfig,
  LearningState,
} from '../../shared/domain/types';
import { addCalendarDays } from '../../shared/time/calendar';
export function emptyProgress(
  profileId: string,
  verbId: string,
  skill: SkillProgress['skill'],
): SkillProgress {
  return {
    profileId,
    verbId,
    skill,
    state: 'new',
    stage: 0,
    dueDate: null,
    lastAdvanceDate: null,
    eligibleDates: [],
    coverage: [],
    hasWrittenContextEvidence: false,
    objectiveError: false,
    selfReportReview: false,
    started: false,
  };
}
export function deriveVisibleState(p: SkillProgress, today: string): LearningState {
  return p.objectiveError || p.selfReportReview || (!!p.dueDate && p.dueDate <= today)
    ? 'needs_review'
    : p.state;
}
export function applyAttempt(
  previous: SkillProgress,
  a: Attempt,
  required: CoverageTarget[],
  config: LearningConfig,
): SkillProgress {
  if (
    previous.profileId !== a.profileId ||
    previous.verbId !== a.verbId ||
    previous.skill !== a.skill
  )
    return previous;
  if (a.superseded) return previous;
  const revision = a.snapshot.coverageVersion ?? a.contentVersion;
  const p =
    (previous.coverageVersion && previous.coverageVersion !== revision) ||
    (previous.started && !previous.coverageVersion && !!a.snapshot.coverageVersion)
      ? emptyProgress(previous.profileId, previous.verbId, previous.skill)
      : structuredClone(previous);
  p.coverageVersion = revision;
  p.started = true;
  if (p.state === 'new') p.state = 'learning';
  if (a.evidenceKind === 'self_report') {
    if (a.selfRating === 'unsure' || a.selfRating === 'unknown') p.selfReportReview = true;
    p.state = deriveVisibleState(p, a.localDate);
    return p;
  }
  if (a.correct === false) {
    Object.assign(p, {
      stage: 0,
      coverage: [],
      eligibleDates: [],
      hasWrittenContextEvidence: false,
      objectiveError: true,
      state: 'needs_review',
      dueDate: addCalendarDays(a.localDate, 1),
    });
    return p;
  }
  const apt =
    a.correct === true &&
    !a.assisted &&
    (!['recall', 'spelling'].includes(a.skill) || (a.isWritten && !a.hasOptions));
  if (!apt || p.lastAdvanceDate === a.localDate || (p.dueDate && a.localDate < p.dueDate)) return p;
  p.stage = Math.min(4, p.stage + 1) as SkillProgress['stage'];
  p.lastAdvanceDate = a.localDate;
  p.eligibleDates.push(a.localDate);
  p.coverage = [...new Set([...p.coverage, ...a.coverageTargetIds])];
  p.hasWrittenContextEvidence ||= a.skill === 'context' && a.isWritten && !a.hasOptions;
  p.objectiveError = false;
  p.selfReportReview = false;
  p.dueDate = addCalendarDays(a.localDate, config.intervalDays[p.stage - 1]);
  const covered =
    ['base', 'pastSimple', 'pastParticiple'].every((form) =>
      required.some((t) => t.form === form),
    ) && required.every((t) => p.coverage.includes(t.id));
  const mastered =
    p.eligibleDates.length >= config.masteryMinAdvances &&
    covered &&
    (p.skill !== 'context' || p.hasWrittenContextEvidence);
  p.state = mastered ? 'mastered' : p.stage >= 2 ? 'consolidating' : 'learning';
  return p;
}
