import type { Attempt, StudySession, XpEntry } from '../../shared/domain/types';
export function computeXp({
  attempt: a,
  session,
  ledger,
}: {
  attempt: Attempt;
  session: StudySession;
  ledger: XpEntry[];
}): XpEntry[] {
  if (a.superseded || a.correct !== true || a.revealed || a.evidenceKind !== 'objective') return [];
  const id = `answer:${a.profileId}:${session.id}:${a.verbId}:${a.target}:${a.skill}`;
  if (ledger.some((x) => x.id === id)) return [];
  return [
    { id, profileId: a.profileId, sessionId: session.id, points: a.assisted ? 5 : 10, at: a.at },
  ];
}
export function finishSessionXp(
  session: StudySession,
  ledger: XpEntry[],
  attempts: Attempt[],
): XpEntry | null {
  const id = `bonus:${session.id}`;
  if (
    !session.completedAt ||
    ledger.some((x) => x.id === id) ||
    !attempts.some((a) => !a.superseded && a.evidenceKind === 'objective')
  )
    return null;
  return {
    id,
    profileId: session.profileId,
    sessionId: session.id,
    points: 20,
    at: session.completedAt,
  };
}
