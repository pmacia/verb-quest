import type { Question } from '../../shared/domain/types';
import { spokenFormText } from '../audio/verb-audio';

/** Read only the English solution from the question snapshot, never its Spanish feedback. */
export function getSolutionAudioText(question: Question): string {
  if (question.mode === 'audio_detective' && question.audioText) return question.audioText;
  if (question.mode === 'matching' && question.matchingPairs)
    return question.matchingPairs
      .map((pair) =>
        pair.acceptedAnswers.map((value) => spokenFormText(value, pair.target)).join(', '),
      )
      .join('. ');
  if (question.mode === 'sentence_gap') {
    const answer = question.acceptedAnswers[0];
    return answer
      ? question.prompt.replace(/_{2,}/, () => spokenFormText(answer, question.target))
      : '';
  }
  return question.acceptedAnswers.map((value) => spokenFormText(value, question.target)).join(', ');
}
