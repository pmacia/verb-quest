import { VerbReviewGame } from './VerbReviewGame';
import { AudioDetectiveGame } from './AudioDetectiveGame';
import { SentenceGapGame } from './SentenceGapGame';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import {
  submitAnswer,
  pauseSession,
  completeSession,
  resumeSession,
  saveReviewDraft,
} from '../learning-engine/session-service';
import { systemClock } from '../../shared/time/clock';
import { skillLabels } from '../progress/selectors';
import {
  QuizGame,
  MatchingGame,
  FlashcardsGame,
  WrittenRecallExercise,
  type GameResponse,
} from './exercises';
import { modeLabels } from '../study-plans/plan-presentation';
import type { StudySession, Question } from '../../shared/domain/types';
import { AudioControls } from '../audio/AudioControls';
import { getSolutionAudioText } from './solution-audio';
export function SessionShell({ session }: { session: StudySession }) {
  const { repos, refresh } = useApp();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{
    question: Question;
    correct: boolean | null;
    text: string;
    autoAudio: boolean;
    reviewResponse?: GameResponse;
  } | null>(null);
  const draftWrite = useRef<Promise<unknown>>(Promise.resolve());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [revealedQuestionId, setRevealedQuestionId] = useState<string | null>(null);
  const question = feedback?.question ?? session.queue[session.cursor];
  const reviewPending = new Set(session.queue.slice(session.cursor).map((q) => q.verbId)).size;
  async function saveAction(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await draftWrite.current;
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    await completeSession(repos, session.id, systemClock);
    await refresh();
    setFeedback(null);
    navigate('/study?summary=' + session.id);
  }
  const errorNotice = error ? (
    <div role="alert" className="notice">
      {error}
    </div>
  ) : null;
  async function submit(response: GameResponse) {
    if (!question || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await submitAnswer(
        repos,
        {
          ...response,
          sessionId: session.id,
          questionId: question.id,
          attemptId: `${session.id}:${question.id}`,
          at: systemClock.now(),
        },
        systemClock,
      );
      setFeedback({
        question,
        correct: r.attempt.correct,
        text: r.feedback,
        autoAudio:
          !response.visualFallback &&
          (question.mode !== 'verb_review' || r.attempt.correct === false),
        reviewResponse: response,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  if (session.status === 'completed' || (!question && !feedback))
    return (
      <div className="panel session-card empty">
        <span className="eyebrow">UN PASO MÁS, BIEN HECHO</span>
        <h1>
          Lo de hoy ya cuenta<span className="dot">.</span>
        </h1>
        <p>
          Has registrado {session.attemptIds.length} respuestas. Tus errores se convertirán en
          oportunidades de repaso.
        </p>
        <p>Revisa en Progreso las habilidades practicadas y las próximas fechas.</p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <Link className="button" to="/progress">
            Ver mi progreso
          </Link>
          <Link className="button secondary" to="/games">
            Elegir otro juego
          </Link>
        </div>
        {errorNotice}
        {session.status !== 'completed' && (
          <button style={{ marginTop: 20 }} disabled={busy} onClick={() => void saveAction(finish)}>
            Finalizar y guardar resumen
          </button>
        )}
      </div>
    );
  if (paused)
    return (
      <div className="panel session-card empty">
        <h2>Tu sesión está a salvo</h2>
        <p>Las respuestas guardadas y la pregunta pendiente seguirán aquí cuando vuelvas.</p>
        {errorNotice}
        <button
          disabled={busy}
          onClick={() =>
            void saveAction(async () => {
              await resumeSession(repos, session.profileId);
              await refresh();
              setPaused(false);
            })
          }
        >
          Continuar
        </button>
        <Link className="button secondary" to="/">
          Volver al inicio
        </Link>
      </div>
    );
  const Exercise =
    question.mode === 'verb_review'
      ? VerbReviewGame
      : question.mode === 'flashcards'
        ? FlashcardsGame
        : question.mode === 'quiz'
          ? QuizGame
          : question.mode === 'matching'
            ? MatchingGame
            : question.mode === 'audio_detective'
              ? AudioDetectiveGame
              : question.mode === 'sentence_gap'
                ? SentenceGapGame
                : WrittenRecallExercise;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{skillLabels[question.skill].toUpperCase()} · PASO A PASO</span>
          <h1>{modeLabels[question.mode]}</h1>
        </div>
        <div className="actions">
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              void saveAction(async () => {
                await pauseSession(repos, session.id);
                setRevealedQuestionId(null);
                setPaused(true);
              })
            }
          >
            Pausar
          </button>
          <button className="secondary" disabled={busy} onClick={() => void saveAction(finish)}>
            Terminar sesión
          </button>
        </div>
      </div>
      <section className={`panel session-card${question.review ? ' vr-session' : ''}`}>
        <div className="row small muted">
          <span>
            {question.mode === 'verb_review' ? 'Repaso libre · tres formas' : 'Tu sesión de hoy'}
          </span>
          <span>
            {question.mode === 'verb_review'
              ? `${reviewPending} ${reviewPending === 1 ? 'verbo pendiente' : 'verbos pendientes'}`
              : `${Math.min(session.cursor + 1, session.queue.length)} / ${session.queue.length}`}
          </span>
        </div>
        {question.mode !== 'verb_review' && (
          <progress
            max={session.queue.length || 1}
            value={session.cursor}
            aria-label="Avance de la sesión"
          />
        )}
        <h2
          className="question-prompt"
          lang={question.review?.language ?? (question.mode === 'sentence_gap' ? 'en' : 'es')}
        >
          {question.prompt}
        </h2>
        {(!feedback || question.mode === 'verb_review') && (
          <Exercise
            key={`exercise:${question.id}`}
            question={question}
            onSubmit={submit}
            disabled={busy}
            onReveal={() => setRevealedQuestionId(question.id)}
            reviewDraft={
              session.reviewDraft?.questionId === question.id ? session.reviewDraft : undefined
            }
            reviewFeedback={feedback?.reviewResponse}
            onReviewDraft={(draft) => {
              draftWrite.current = saveReviewDraft(repos, session.id, draft).catch(() =>
                setError(
                  'No se ha podido guardar el borrador. Mantén esta página abierta e inténtalo de nuevo.',
                ),
              );
            }}
          />
        )}
        <p role="status" className="small muted">
          {busy ? 'Guardando respuesta…' : ''}
        </p>
        {error && (
          <div role="alert" className="notice">
            {error}
          </div>
        )}
        {feedback && (
          <div
            className={`feedback ${feedback.correct === false ? 'incorrect' : 'correct'}`}
            role="status"
          >
            <h3>
              {feedback.correct === null
                ? 'Valoración guardada'
                : feedback.correct
                  ? '¡Bien recordado!'
                  : 'Vamos a darle otra vuelta'}
            </h3>
            <p>{feedback.text}</p>
            {feedback.correct === false && (
              <p>
                {question.mode === 'verb_review'
                  ? 'Volverá a aparecer más adelante en esta partida. Puedes pausar o terminar cuando quieras.'
                  : 'Volverá a aparecer al final y mañana tendrás un repaso.'}
              </p>
            )}
          </div>
        )}
        {(feedback || revealedQuestionId === question.id) && (
          <AudioControls
            key={`solution-audio:${question.id}`}
            text={getSolutionAudioText(question)}
            label="Escuchar solución"
            dialect={question.review?.dialect}
            forceDialect={!!question.review}
            iconOnly
            autoPlay={feedback?.autoAudio ?? true}
          />
        )}
        {feedback && (
          <button
            disabled={busy}
            onClick={() =>
              void saveAction(async () => {
                if (session.cursor >= session.queue.length) await finish();
                else setFeedback(null);
              })
            }
          >
            {session.cursor >= session.queue.length ? 'Ver resumen' : 'Siguiente pregunta'} →
          </button>
        )}
      </section>
    </>
  );
}
