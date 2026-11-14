import { useMemo, useRef } from 'react';
import { useApp } from '../../app/app-context';
import { Icon } from '../../shared/ui/Icon';
import { AudioControls } from '../audio/AudioControls';
import { evaluateReview, reviewFormLabels, reviewSuggestion } from '../question-engine/verb-review';
import { useReviewInput } from './use-review-input';
import type { GameProps } from './exercises';
import './verb-review.css';
export function VerbReviewGame(props: GameProps) {
  const input = useReviewInput(props);
  const { verbs } = useApp();
  const vocabulary = useMemo(
    () =>
      verbs.flatMap((verb) => [
        verb.forms.base.value,
        ...verb.forms.pastSimple.variants.map((v) => v.value),
        ...verb.forms.pastParticiple.variants.map((v) => v.value),
      ]),
    [verbs],
  );
  const fields = useRef<Array<HTMLInputElement | null>>([]);
  const recording = input.state !== 'idle';
  const feedback = props.reviewFeedback
    ? evaluateReview(props.question, props.reviewFeedback)
    : undefined;
  const values =
    props.reviewFeedback && Array.isArray(props.reviewFeedback.answer)
      ? props.reviewFeedback.answer
      : input.draft.values;
  function microphone(field?: number) {
    return (
      <button
        type="button"
        className="secondary vr-mic"
        aria-label={
          field === undefined ? 'Dictar las tres formas' : `Dictar ${reviewFormLabels[field]}`
        }
        aria-pressed={recording && input.field === field}
        disabled={
          props.disabled || !!feedback || input.blocked || (recording && input.field !== field)
        }
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            /* The gesture can survive unavailable pointer capture. */
          }
          input.start(field);
        }}
        onPointerUp={(event) => {
          event.preventDefault();
          input.stop();
        }}
        onPointerCancel={input.stop}
        onLostPointerCapture={input.stop}
        onBlur={input.stop}
        onKeyDown={(event) => {
          if ([' ', 'Enter'].includes(event.key)) {
            event.preventDefault();
            if (!event.repeat) input.start(field);
          }
        }}
        onKeyUp={(event) => {
          if ([' ', 'Enter'].includes(event.key)) {
            event.preventDefault();
            input.stop();
          }
        }}
        onClick={(event) => {
          if (event.detail === 0) input.start(field);
        }}
      >
        <Icon name="mic" size={17} />
        {field === undefined && (
          <span>
            {recording
              ? input.state === 'preparing'
                ? 'Preparando…'
                : input.state === 'processing'
                  ? 'Procesando…'
                  : 'Escuchando…'
              : 'Mantén para hablar'}
          </span>
        )}
      </button>
    );
  }
  return (
    <div className="verb-review-game">
      {!feedback && (
        <>
          <div className="vr-prompt-audio" onClickCapture={input.abort}>
            <AudioControls
              text={props.question.prompt.replace(/·|\//g, ', ')}
              label="Escuchar pregunta"
              language={props.question.review?.language ?? 'es'}
              dialect={props.question.review?.dialect}
              forceDialect
              iconOnly
              autoPlay
            />
          </div>
          <p className="small muted">
            Responde con infinitivo, pasado y participio. Puedes escribir o dictar en inglés.
          </p>
        </>
      )}
      {!feedback && input.supported && !input.blocked && (
        <div className="actions vr-actions">
          {input.supported && !input.blocked && microphone()}
          {recording && (
            <button type="button" className="secondary" onClick={input.stop}>
              <Icon name="stop" size={16} />
              Terminar dictado
            </button>
          )}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!feedback) void input.check();
        }}
      >
        <div className="vr-columns">
          {values.map((value, index) => {
            const result = feedback?.columns[index];
            const suggestion =
              !feedback &&
              (input.draft.fieldMethods?.[index] ?? input.draft.inputMethod) !== 'keyboard' &&
              !recording
                ? reviewSuggestion(props.question, value, index, vocabulary)
                : undefined;
            return (
              <div
                className={`vr-column${result ? (result.correct ? ' is-correct' : ' is-incorrect') : ''}`}
                key={index}
              >
                <label>
                  <span>{reviewFormLabels[index]}</span>
                  <input
                    aria-label={reviewFormLabels[index]}
                    ref={(element) => {
                      fields.current[index] = element;
                    }}
                    value={value}
                    maxLength={100}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    lang="en"
                    readOnly={!!feedback}
                    disabled={props.disabled}
                    onChange={(event) => input.write(index, event.target.value)}
                  />
                </label>
                {!feedback && input.supported && !input.blocked && microphone(index)}
                {result && (
                  <p className="vr-column-result">
                    <Icon name={result.correct ? 'check' : 'close'} size={16} />
                    {result.correct ? (
                      'Correcto'
                    ) : (
                      <>
                        <span>Respuesta: </span>
                        <strong lang="en">{result.accepted.join(' / ')}</strong>
                      </>
                    )}
                  </p>
                )}
                {suggestion && (
                  <button
                    type="button"
                    className="secondary vr-suggestion"
                    onClick={() => input.suggest(index, suggestion)}
                  >
                    Usar «{suggestion}»{' '}
                    <span className="sr-only">en {reviewFormLabels[index]} como ayuda</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!feedback && (
          <>
            <div className="actions vr-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  input.abort();
                  fields.current.find((field) => !field?.value)?.focus();
                  if (fields.current.every((field) => field?.value)) fields.current[0]?.focus();
                }}
              >
                <Icon name="edit" size={16} />
                Escribir
              </button>
              <button
                type="submit"
                disabled={props.disabled || recording || values.some((value) => !value.trim())}
              >
                <Icon name="check" size={16} />
                Comprobar
              </button>
            </div>
            <p className="vr-status small" role="status">
              {input.heard ? `Estoy escuchando: ${input.heard}` : input.message}
            </p>
            {!input.supported && (
              <p className="small muted">
                Este navegador no ofrece dictado aquí. Puedes escribir o usar el micrófono de tu
                teclado si está disponible.
              </p>
            )}
            {input.blocked && (
              <button type="button" className="secondary" onClick={input.unblock}>
                Volver a probar el micrófono
              </button>
            )}
            {input.supported && (
              <details className="vr-help">
                <summary>Ayuda con el micrófono</summary>
                <p>
                  Mantén el botón mientras hablas y suéltalo al terminar. Si la escucha se corta,
                  conserva las casillas y continúa en una de ellas. El dictado puede necesitar
                  Internet y utilizar el servicio del navegador. Puedes usar siempre el teclado.
                </p>
              </details>
            )}
          </>
        )}
      </form>
    </div>
  );
}
