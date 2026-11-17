import { useId, useMemo, useRef } from 'react';
import { useApp } from '../../app/app-context';
import { Icon } from '../../shared/ui/Icon';
import { AudioControls } from '../audio/AudioControls';
import { evaluateReview, reviewFormLabels, reviewSuggestion } from '../question-engine/verb-review';
import { useReviewInput } from './use-review-input';
import type { GameProps } from './exercises';
import './verb-review.css';

export function VerbReviewGame(props: GameProps) {
  const input = useReviewInput(props);
  const { verbs, settings } = useApp();
  const id = useId();
  const help = useRef<HTMLDetailsElement>(null);
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
  const complete = values.every((value) => value.trim());
  const voiceAvailable = input.supported && !input.blocked;
  const hasDictation =
    values.some((value) => value.trim()) && input.draft.inputMethod !== 'keyboard';
  const canDiscard = input.canDiscard && hasDictation;
  const dockHadCheck = useRef(false);
  const showCheck = recording ? dockHadCheck.current : !voiceAvailable || complete || hasDictation;
  const micHint =
    input.state === 'preparing'
      ? 'Preparando…'
      : input.state === 'processing'
        ? 'Procesando…'
        : input.state === 'listening'
          ? 'Suelta al terminar'
          : 'Mantén para hablar';
  function focusWriting() {
    input.abort();
    (fields.current.find((field) => !field?.value) ?? fields.current[0])?.focus();
  }
  function showHelp() {
    if (help.current) {
      help.current.open = !help.current.open;
      if (help.current.open) help.current.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
  }
  function microphone(field?: number, repeat = false) {
    const label =
      field === undefined
        ? repeat
          ? 'Repetir dictado de las tres formas'
          : 'Dictar las tres formas'
        : `Dictar ${reviewFormLabels[field]}`;
    return (
      <button
        type="button"
        key={field === undefined ? (repeat ? 'repeat-mic' : 'main-mic') : `field-mic-${field}`}
        className={
          field !== undefined
            ? 'vr-mic vr-field-mic'
            : repeat
              ? 'vr-side-action vr-repeat vr-mic'
              : 'vr-mic vr-main-mic'
        }
        aria-label={label}
        title={label}
        aria-pressed={recording && input.field === field}
        disabled={
          props.disabled ||
          !!feedback ||
          input.blocked ||
          (recording && (input.field !== field || input.state === 'processing'))
        }
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            /* Capture is optional. */
          }
          dockHadCheck.current = showCheck;
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
            if (!event.repeat) {
              dockHadCheck.current = showCheck;
              input.start(field);
            }
          }
        }}
        onKeyUp={(event) => {
          if ([' ', 'Enter'].includes(event.key)) {
            event.preventDefault();
            input.stop();
          }
        }}
        onClick={(event) => {
          if (event.detail === 0) {
            if (recording && input.field === field) input.stop();
            else {
              dockHadCheck.current = showCheck;
              input.start(field);
            }
          }
        }}
      >
        {repeat ? (
          <>
            <span className="vr-side-circle">
              <Icon name="mic" size={20} />
            </span>
            <span>Repetir</span>
          </>
        ) : (
          <Icon name="mic" size={field === undefined ? 30 : 17} />
        )}
      </button>
    );
  }
  return (
    <div className={`verb-review-game${feedback ? ' has-feedback' : ''}`} data-state={input.state}>
      <div className="vr-question">
        <span className="vr-question-label">
          {props.question.review?.language === 'en'
            ? 'Recuerda las tres formas'
            : '¿Cómo se dice en inglés?'}
        </span>
        <div className="vr-question-word">
          <h2 className="question-prompt" lang={props.question.review?.language ?? 'es'}>
            {props.question.prompt}
          </h2>
          {!feedback && (
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
          )}
        </div>
        <p>Infinitivo, pasado y participio. Tú puedes.</p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!feedback && !recording && complete && !props.disabled) void input.check();
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
                onClick={(event) => {
                  if (!feedback && !(event.target as HTMLElement).closest('button'))
                    fields.current[index]?.focus();
                }}
              >
                <label htmlFor={`${id}-${index}`}>
                  <span className="vr-form-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  {reviewFormLabels[index]}
                </label>
                <div className="vr-entry">
                  <input
                    id={`${id}-${index}`}
                    aria-label={reviewFormLabels[index]}
                    ref={(element) => {
                      fields.current[index] = element;
                    }}
                    value={value}
                    maxLength={100}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="…"
                    lang="en"
                    readOnly={!!feedback}
                    disabled={props.disabled}
                    onFocus={input.abort}
                    onChange={(event) => input.write(index, event.target.value)}
                  />
                  {!feedback && voiceAvailable && microphone(index)}
                </div>
                {result && (
                  <p className="vr-column-result">
                    <Icon name={result.correct ? 'check' : 'close'} size={16} />
                    {result.correct ? (
                      'Correcto'
                    ) : (
                      <>
                        <span>Respuesta:</span>
                        <strong lang="en">{result.accepted.join(' / ')}</strong>
                      </>
                    )}
                  </p>
                )}
                {suggestion && (
                  <button
                    type="button"
                    className="vr-suggestion"
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
            <div
              className="vr-dock"
              data-state={input.state}
              onPointerDownCapture={(event) => {
                // Keep the mobile dock in place while a focused input's keyboard is open.
                // Losing input focus on pointerdown would move a sticky button before click.
                if ((event.target as HTMLElement).closest('button')) event.preventDefault();
              }}
            >
              <button
                type="button"
                className="vr-side-action"
                disabled={props.disabled || recording}
                aria-label={canDiscard ? 'Descartar dictado' : 'Escribir'}
                onClick={canDiscard ? input.discard : focusWriting}
              >
                <span className="vr-side-circle">
                  <Icon name={canDiscard ? 'close' : 'edit'} size={20} />
                </span>
                <span>{canDiscard ? 'Descartar' : 'Escribir'}</span>
              </button>
              <div className="vr-central">
                {showCheck ? (
                  <button
                    type="submit"
                    key="check-answer"
                    className="vr-check"
                    aria-label="Comprobar"
                    title="Comprobar"
                    disabled={props.disabled || recording || !complete}
                  >
                    <Icon name="check" size={28} />
                  </button>
                ) : (
                  microphone()
                )}
                <span className="vr-control-hint">
                  {recording ? micHint : showCheck ? 'Comprobar' : micHint}
                </span>
              </div>
              {showCheck && voiceAvailable ? (
                microphone(undefined, true)
              ) : !showCheck ? (
                <button
                  type="submit"
                  className="vr-side-action vr-side-check"
                  aria-label="Comprobar"
                  disabled={props.disabled || recording || !complete}
                >
                  <span className="vr-side-circle">
                    <Icon name="check" size={20} />
                  </span>
                  <span>Comprobar</span>
                </button>
              ) : (
                <button type="button" className="vr-side-action" onClick={showHelp}>
                  <span className="vr-side-circle">
                    <Icon name="info" size={20} />
                  </span>
                  <span>Ayuda</span>
                </button>
              )}
            </div>
            <p className="vr-status" role="status">
              {input.heard
                ? `Estoy escuchando: ${input.heard}`
                : input.message ||
                  (recording ? micHint : 'También puedes escribir en las tres casillas.')}
            </p>
            {!input.supported && (
              <p className="vr-fallback">
                Este navegador no ofrece dictado aquí. Puedes escribir o usar el micrófono de tu
                teclado si está disponible.
              </p>
            )}
            {input.blocked && (
              <button type="button" className="secondary vr-retry" onClick={input.unblock}>
                Volver a probar el micrófono
              </button>
            )}
            <div className="vr-footer">
              <span>
                {props.question.review?.dialect === 'us' ? 'Inglés americano' : 'Inglés británico'}{' '}
                ·{' '}
                {settings.reviewCheck === 'manual' ? 'Revisión manual' : 'Comprobación automática'}
              </span>
              <button type="button" onClick={showHelp} aria-controls={`${id}-help`}>
                <Icon name="info" size={15} /> Dictado
              </button>
            </div>
            <details className="vr-help" ref={help} id={`${id}-help`}>
              <summary>Ayuda con el micrófono</summary>
              <p>
                Mantén el botón mientras hablas y suéltalo al terminar. Con un lector de pantalla,
                activa el botón para empezar y actívalo de nuevo para terminar. Si la escucha se
                corta, conserva las casillas y continúa en una de ellas. El dictado puede necesitar
                Internet y utilizar el servicio del navegador. Puedes usar siempre el teclado.
              </p>
            </details>
          </>
        )}
      </form>
    </div>
  );
}
