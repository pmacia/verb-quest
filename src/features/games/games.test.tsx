import { it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';
import { QuizGame, FlashcardsGame, MatchingGame, WrittenRecallExercise } from './exercises';
import type { Question } from '../../shared/domain/types';
afterEach(cleanup);
const q: Question = {
  id: 'q',
  version: '1',
  verbId: 'go',
  contentVersion: '1',
  mode: 'quiz',
  skill: 'recognition',
  target: 'pastSimple',
  coverageTargetIds: ['pastSimple'],
  prompt: 'Pasado de go',
  acceptedAnswers: ['went'],
  options: ['go', 'went', 'gone'],
  explanation: 'go → went',
  evidenceKind: 'objective',
  isWritten: false,
};
it('quiz submits a selected answer without deciding its correctness', async () => {
  let answer = '';
  render(
    <QuizGame
      question={q}
      onSubmit={async (a) => {
        answer = String(a.answer);
      }}
      disabled={false}
    />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'went' }));
  expect(answer).toBe('went');
});
it('flashcard requires reveal and preserves self-report', async () => {
  let result: any;
  render(
    <FlashcardsGame
      question={{ ...q, mode: 'flashcards' }}
      onSubmit={async (a) => {
        result = a;
      }}
      disabled={false}
    />,
  );
  expect(screen.queryByRole('button', { name: 'Lo sabía' })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Revelar respuesta' }));
  await userEvent.click(screen.getByRole('button', { name: 'Dudé' }));
  expect(result.selfRating).toBe('unsure');
  expect(result.revealed).toBe(true);
});
it('matching builds associations with keyboard before submitting the board', async () => {
  let result = '';
  render(
    <MatchingGame
      question={{ ...q, mode: 'matching' }}
      onSubmit={async (a) => {
        result = String(a.answer);
      }}
      disabled={false}
    />,
  );
  const left = screen.getByRole('group', { name: 'Pistas para emparejar' });
  await userEvent.click(left.querySelector('button')!);
  const option = screen.getByRole('button', { name: 'went' });
  option.focus();
  await userEvent.keyboard('{Enter}');
  expect(result).toBe('');
  await userEvent.click(screen.getByRole('button', { name: 'Comprobar parejas' }));
  expect(result).toBe('went');
});
it('written recall has no answer options and prevents duplicate pending sends', async () => {
  let result = '';
  const view = render(
    <WrittenRecallExercise
      question={{ ...q, options: [], isWritten: true }}
      onSubmit={async (a) => {
        result = String(a.answer);
      }}
      disabled={false}
    />,
  );
  await userEvent.type(screen.getByLabelText('Tu respuesta'), 'went');
  await userEvent.click(screen.getByRole('button', { name: 'Comprobar' }));
  expect(result).toBe('went');
  view.rerender(<WrittenRecallExercise question={q} onSubmit={async () => {}} disabled={true} />);
  expect(screen.getByRole('button', { name: 'Comprobar' })).toBeDisabled();
});
