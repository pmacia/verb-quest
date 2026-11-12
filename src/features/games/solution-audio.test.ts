import { expect, it } from 'vitest';
import type { Question } from '../../shared/domain/types';
import { getSolutionAudioText } from './solution-audio';
const question: Question = {
  id: 'q',
  version: '1',
  verbId: 'read',
  contentVersion: '1',
  mode: 'quiz',
  skill: 'recognition',
  target: 'pastSimple',
  coverageTargetIds: ['pastSimple'],
  prompt: '¿Pasado de read?',
  acceptedAnswers: ['read'],
  options: [],
  explanation: 'read → read. Explicación en español.',
  evidenceKind: 'objective',
  isWritten: false,
};
it('speaks the correct answer, with the tense-specific pronunciation of read', () => {
  expect(getSolutionAudioText(question)).toBe('red');
  expect(getSolutionAudioText({ ...question, target: 'base' })).toBe('reed');
  expect(getSolutionAudioText({ ...question, acceptedAnswers: ['was', 'were'] })).toBe('was, were');
});
it('completes the English sentence without speaking its Spanish explanation', () => {
  expect(
    getSolutionAudioText({
      ...question,
      mode: 'sentence_gap',
      prompt: 'She ____ a book yesterday.',
    }),
  ).toBe('She red a book yesterday.');
  expect(
    getSolutionAudioText({
      ...question,
      mode: 'sentence_gap',
      acceptedAnswers: ['went'],
      prompt: 'We ____ home.',
    }),
  ).toBe('We went home.');
});
it('speaks matching forms in their displayed order, including different read pronunciations', () => {
  expect(
    getSolutionAudioText({
      ...question,
      mode: 'matching',
      matchingPairs: [
        {
          id: 'b',
          left: 'Base',
          right: 'read',
          acceptedAnswers: ['read'],
          target: 'base',
          coverageTargetIds: ['base'],
        },
        {
          id: 'p',
          left: 'Pasado',
          right: 'read',
          acceptedAnswers: ['read'],
          target: 'pastSimple',
          coverageTargetIds: ['pastSimple'],
        },
        {
          id: 'pp',
          left: 'Participio',
          right: 'read',
          acceptedAnswers: ['read'],
          target: 'pastParticiple',
          coverageTargetIds: ['pastParticiple'],
        },
      ],
    }),
  ).toBe('reed. red. red');
});
it('preserves the audio clue snapshot in a listening exercise', () => {
  expect(getSolutionAudioText({ ...question, mode: 'audio_detective', audioText: 'red' })).toBe(
    'red',
  );
});
