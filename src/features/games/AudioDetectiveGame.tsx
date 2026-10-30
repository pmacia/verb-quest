import { useState } from 'react';
import { AudioControls } from '../audio/AudioControls';
import { WrittenRecallExercise, type GameProps } from './exercises';
export function AudioDetectiveGame(props: GameProps) {
  const [listened, setListened] = useState(false);
  const [visual, setVisual] = useState(false);
  return (
    <>
      <p className="small muted">
        La voz es sintética. Su disponibilidad sin conexión depende de tu dispositivo.
      </p>
      {!visual && (
        <AudioControls
          text={props.question.audioText ?? props.question.acceptedAnswers[0]}
          label="Escuchar la forma oculta"
          onPlayed={() => setListened(true)}
        />
      )}
      <button
        type="button"
        className="text-button"
        disabled={props.disabled}
        onClick={() => setVisual(true)}
      >
        No puedo usar audio · alternativa visual
      </button>
      {visual ? (
        <>
          <p className="notice">
            Alternativa de escritura. Esta respuesta no contará como escucha.
          </p>
          <h3>{props.question.visualPrompt ?? 'Escribe la forma indicada.'}</h3>
          <WrittenRecallExercise
            {...props}
            onSubmit={(a) => props.onSubmit({ ...a, visualFallback: true })}
          />
        </>
      ) : listened ? (
        <WrittenRecallExercise {...props} />
      ) : (
        <p className="small muted">
          Escucha primero. Si no hay voz disponible, elige la alternativa visual.
        </p>
      )}
    </>
  );
}
