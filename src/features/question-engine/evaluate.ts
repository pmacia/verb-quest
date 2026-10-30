import type { Question, AnswerInput } from '../../shared/domain/types';
export const normalizeAnswer = (s: string) => s.normalize('NFC').trim().toLocaleLowerCase('en');
export function evaluateAnswer(question: Question, input: AnswerInput) {
  const answer = Array.isArray(input.answer) ? input.answer.join(' ') : input.answer;
  let matchingCorrect = false;
  if (question.matchingPairs && Array.isArray(input.answer)) {
    try {
      const entries = input.answer.map((value) => JSON.parse(value));
      matchingCorrect =
        entries.length === question.matchingPairs.length &&
        entries.every(
          (e) =>
            Array.isArray(e) &&
            e.length === 2 &&
            typeof e[0] === 'string' &&
            typeof e[1] === 'string',
        ) &&
        new Set(entries.map((e) => e[0])).size === entries.length &&
        question.matchingPairs.every((pair) =>
          entries.some(
            ([id, value]) =>
              id === pair.id &&
              pair.acceptedAnswers.some((s) => normalizeAnswer(s) === normalizeAnswer(value)),
          ),
        );
    } catch {
      matchingCorrect = false;
    }
  }
  return {
    correct:
      question.evidenceKind === 'self_report'
        ? null
        : question.matchingPairs
          ? matchingCorrect
          : question.acceptedAnswers.some((s) => normalizeAnswer(s) === normalizeAnswer(answer)),
    assisted: input.hintsUsed || input.revealed,
    evidenceKind: question.evidenceKind,
    acceptedAnswers: question.acceptedAnswers,
  };
}
