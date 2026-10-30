import type { Attempt } from '../../src/shared/domain/types';
export function attempt(date: string, target = 'base', patch: Partial<Attempt> = {}): Attempt {
  return {
    attemptId: crypto.randomUUID(),
    sessionId: 's',
    questionId: 'q',
    answer: 'go',
    at: date + 'T12:00:00Z',
    profileId: 'p',
    verbId: 'go',
    questionVersion: '1',
    contentVersion: '1',
    skill: 'recall',
    target: 'base',
    coverageTargetIds: [target],
    mode: 'written_recall',
    evidenceKind: 'objective',
    correct: true,
    hasOptions: false,
    isWritten: true,
    assisted: false,
    localDate: date,
    hintsUsed: false,
    revealed: false,
    snapshot: {} as any,
    ...patch,
  };
}
