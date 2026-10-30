import { useState } from 'react';
import type { AnswerInput, Question } from '../../shared/domain/types';
export type GameResponse = Pick<
  AnswerInput,
  'answer' | 'selfRating' | 'hintsUsed' | 'revealed' | 'visualFallback'
>;
export interface GameProps {
  question: Question;
  onSubmit: (input: GameResponse) => Promise<void>;
  disabled: boolean;
}
const response = (answer: string): GameResponse => ({ answer, hintsUsed: false, revealed: false });
export function QuizGame({ question, onSubmit, disabled }: GameProps) {
  return (
    <div className="answer-options">
      {question.options.map((o) => (
        <button
          className="secondary"
          key={o}
          disabled={disabled}
          onClick={() => void onSubmit(response(o))}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
export function MatchingGame({ question, onSubmit, disabled }: GameProps) {
  const pairs = question.matchingPairs ?? [
    {
      id: 'legacy',
      left: question.prompt,
      right: question.acceptedAnswers[0],
      acceptedAnswers: question.acceptedAnswers,
    },
  ];
  const [selected, setSelected] = useState<string | null>(pairs[0]?.id ?? null);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  return (
    <>
      <p className="small muted">
        Elige una pista y después su forma. Puedes cambiar cada pareja antes de comprobar.
      </p>
      <div className="matching-board">
        <div role="group" aria-label="Pistas para emparejar" className="matching-column">
          {pairs.map((pair) => (
            <button
              type="button"
              className="secondary"
              key={pair.id}
              disabled={disabled}
              aria-pressed={selected === pair.id}
              onClick={() => setSelected(pair.id)}
            >
              {pair.left}
              {assignments[pair.id] !== undefined
                ? ` → ${question.options[assignments[pair.id]]}`
                : ''}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Formas para emparejar" className="matching-column" lang="en">
          {question.options.map((value, index) => (
            <button
              type="button"
              className="secondary"
              key={index}
              disabled={
                disabled ||
                !selected ||
                Object.entries(assignments).some(([id, tile]) => tile === index && id !== selected)
              }
              onClick={() => {
                if (!selected) return;
                const next = { ...assignments, [selected]: index };
                setAssignments(next);
                setSelected(pairs.find((pair) => next[pair.id] === undefined)?.id ?? selected);
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !Object.keys(assignments).length}
        onClick={() => {
          setAssignments({});
          setSelected(pairs[0]?.id ?? null);
        }}
      >
        Borrar parejas
      </button>
      <button
        disabled={disabled || pairs.some((pair) => assignments[pair.id] === undefined)}
        onClick={() =>
          void onSubmit({
            answer: question.matchingPairs
              ? pairs.map((pair) =>
                  JSON.stringify([pair.id, question.options[assignments[pair.id]]]),
                )
              : question.options[assignments[pairs[0].id]],
            hintsUsed: false,
            revealed: false,
          })
        }
      >
        Comprobar parejas
      </button>
    </>
  );
}
export function FlashcardsGame({ question, onSubmit, disabled }: GameProps) {
  const [revealed, setRevealed] = useState(false);
  return revealed ? (
    <>
      <div className="flashcard-answer" lang="en">
        {question.acceptedAnswers.join(' / ')}
      </div>
      <p className="small muted">Esta valoración es personal; no cuenta como prueba objetiva.</p>
      <div className="actions">
        {(
          [
            ['known', 'Lo sabía'],
            ['unsure', 'Dudé'],
            ['unknown', 'No lo sabía'],
          ] as const
        ).map(([selfRating, label]) => (
          <button
            className="secondary"
            disabled={disabled}
            key={selfRating}
            onClick={() =>
              void onSubmit({ answer: '', selfRating, hintsUsed: false, revealed: true })
            }
          >
            {label}
          </button>
        ))}
      </div>
    </>
  ) : (
    <div className="empty">
      <p>Intenta recordarlo antes de mirar.</p>
      <button disabled={disabled} onClick={() => setRevealed(true)}>
        Revelar respuesta
      </button>
    </div>
  );
}
export function WrittenRecallExercise({ question, onSubmit, disabled }: GameProps) {
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (answer.trim()) void onSubmit({ ...response(answer), hintsUsed: hint });
      }}
    >
      <label>
        Tu respuesta
        <input
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          lang="en"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled}
        />
      </label>
      {hint && (
        <p className="notice">
          Empieza por «{question.acceptedAnswers[0][0]}». Las respuestas con pista son práctica
          asistida.
        </p>
      )}
      <div className="actions">
        <button disabled={disabled || !answer.trim()}>Comprobar</button>
        <button
          type="button"
          className="secondary"
          disabled={disabled || hint}
          onClick={() => setHint(true)}
        >
          Una pista
        </button>
      </div>
    </form>
  );
}
