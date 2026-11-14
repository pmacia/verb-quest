import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import {
  ActiveSessionError,
  replaceSession,
  startSession,
  type SessionRequest,
} from '../learning-engine/session-service';
import { Dialog } from '../../shared/ui/Dialog';
import { systemClock } from '../../shared/time/clock';
import { Icon } from '../../shared/ui/Icon';
import type { QuestionMode, EvaluatedSkill, StudySession } from '../../shared/domain/types';
export const gameCards: {
  mode: QuestionMode;
  title: string;
  description: string;
  icon: string;
  tag: string;
  skills: EvaluatedSkill[];
}[] = [
  {
    mode: 'flashcards',
    title: 'Flashcards',
    description: 'Piensa, recuerda y descubre. Tú decides cuánto sabías.',
    icon: 'book',
    tag: 'MEMORIA · AUTOEVALUACIÓN',
    skills: ['recall'],
  },
  {
    mode: 'matching',
    title: 'Emparejar formas',
    description: 'Conecta cada pista con la forma correcta del verbo.',
    icon: 'study',
    tag: 'RECONOCIMIENTO',
    skills: ['recognition'],
  },
  {
    mode: 'quiz',
    title: 'Quiz de verbos',
    description: 'Una pregunta, varias posibilidades. Encuentra la tuya.',
    icon: 'bolt',
    tag: 'RECONOCIMIENTO',
    skills: ['recognition'],
  },
  {
    mode: 'audio_detective',
    title: 'Audio Detective',
    description: 'Afina el oído y descubre la palabra que se esconde.',
    icon: 'sound',
    tag: 'ESCUCHA',
    skills: ['listening'],
  },
  {
    mode: 'sentence_gap',
    title: 'Completa la frase',
    description: 'Lleva lo que sabes a una situación de verdad.',
    icon: 'check',
    tag: 'CONTEXTO · ESCRITURA',
    skills: ['context'],
  },
  {
    mode: 'verb_review',
    title: 'Repaso de verbos',
    description: 'Recuerda el infinitivo, pasado y participio. Escribe o usa tu voz.',
    icon: 'restore',
    tag: 'TRES FORMAS · MEMORIA',
    skills: ['recall'],
  },
];
export function GamesPage() {
  const { lists, plans, verbs, repos, profile, refresh, settings } = useApp();
  const [scope, setScope] = useState('all');
  const [reviewLanguage, setReviewLanguage] = useState<'es' | 'en'>(
    settings.reviewLanguage ?? 'es',
  );
  const [manual, setManual] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const launchLock = useRef(false);
  const [pending, setPending] = useState<{
    session: StudySession;
    request: SessionRequest;
    title: string;
  } | null>(null);
  function closePending() {
    if (launchLock.current) return;
    setPending(null);
    setError('');
  }
  async function launch(request: SessionRequest, title: string, previousSessionId?: string) {
    if (launchLock.current) return;
    launchLock.current = true;
    setBusy(true);
    setError('');
    try {
      if (previousSessionId)
        await replaceSession(repos, request, previousSessionId, systemClock, Math.random);
      else await startSession(repos, request, systemClock, Math.random);
      await refresh();
      setPending(null);
      navigate('/study');
    } catch (error) {
      if (error instanceof ActiveSessionError)
        setPending({ session: error.session, request, title });
      else setError(error instanceof Error ? error.message : String(error));
    } finally {
      launchLock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CADA PARTIDA CUENTA</span>
          <h1>
            Otra forma de aprender<span className="dot">.</span>
          </h1>
          <p>Elige tu reto y dale una vuelta más a lo que sabes.</p>
        </div>
      </div>
      <section className="panel row wrap" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>¿Con qué verbos jugamos?</h2>
          <p className="small" style={{ margin: 0 }}>
            Todos los modos comparten la misma selección.
          </p>
        </div>
        <label>
          Selección de verbos
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">Toda mi biblioteca</option>
            <option value="manual">Selección manual</option>
            {plans
              .filter((p) => !p.isTemplate)
              .map((p) => (
                <option key={p.id} value={'plan:' + p.id}>
                  Plan · {p.name}
                </option>
              ))}
            {lists.map((l) => (
              <option value={l.id} key={l.id}>
                {l.name} · {l.verbIds.length} verbos
              </option>
            ))}
          </select>
        </label>
      </section>
      {scope === 'manual' && (
        <fieldset className="panel" style={{ marginBottom: 24 }}>
          <legend>Elige los verbos de la partida</legend>
          <div className="filter-grid">
            {verbs
              .filter((v) => !v.archivedAt)
              .map((v) => (
                <label className="check-label" key={v.id}>
                  <input
                    type="checkbox"
                    checked={manual.includes(v.id)}
                    onChange={(e) =>
                      setManual(
                        e.target.checked ? [...manual, v.id] : manual.filter((id) => id !== v.id),
                      )
                    }
                  />
                  {v.lemma} · {v.meanings[0]}
                </label>
              ))}
          </div>
        </fieldset>
      )}
      {error && !pending && (
        <div role="alert" className="notice">
          {error}
        </div>
      )}
      <div className="cards-grid">
        {gameCards.map((g) => (
          <article className="panel game-card" key={g.mode}>
            <span className="game-icon">
              <Icon name={g.icon} size={28} />
            </span>
            <span className="eyebrow">{g.tag}</span>
            <h2>{g.title}</h2>
            <p>{g.description}</p>
            {g.mode === 'verb_review' && (
              <label>
                Idioma de la pista
                <select
                  aria-label="Idioma de la pista"
                  value={reviewLanguage}
                  onChange={(e) => setReviewLanguage(e.target.value as 'es' | 'en')}
                >
                  <option value="es">Castellano</option>
                  <option value="en">Inglés</option>
                </select>
              </label>
            )}
            <button
              disabled={busy}
              onClick={() => {
                const ids =
                  scope === 'manual'
                    ? manual
                    : scope === 'all'
                      ? verbs.filter((v) => !v.archivedAt).map((v) => v.id)
                      : (lists.find((l) => l.id === scope)?.verbIds ?? []);
                void launch(
                  {
                    kind: 'free',
                    ...(g.mode === 'verb_review' ? { reviewLanguage } : {}),
                    ...(scope.startsWith('plan:') ? { planId: scope.slice(5) } : {}),
                    profileId: profile.id,
                    verbIds: ids,
                    modes: [g.mode],
                    skills: g.skills,
                  },
                  g.title,
                );
              }}
            >
              Jugar ahora <Icon name="arrow" size={18} />
            </button>
          </article>
        ))}
      </div>
      {pending && (
        <Dialog title="Ya tienes una sesión en marcha" onClose={closePending}>
          <p>
            Tu sesión anterior{' '}
            {pending.session.status === 'paused' ? 'está en pausa' : 'sigue pendiente'} y tiene{' '}
            <strong>
              {pending.session.attemptIds.length}{' '}
              {pending.session.attemptIds.length === 1
                ? 'respuesta guardada'
                : 'respuestas guardadas'}
            </strong>
            .
          </p>
          <p>
            Para empezar <strong>{pending.title}</strong>, puedes cerrar la sesión anterior. Tus
            respuestas y tu progreso se conservarán.
          </p>
          {error && (
            <p className="notice" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <button type="button" className="secondary" disabled={busy} onClick={closePending}>
              Cancelar
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                setPending(null);
                navigate('/study');
              }}
            >
              <Icon name="play" size={18} />
              Continuar sesión anterior
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void launch(pending.request, pending.title, pending.session.id)}
            >
              <Icon name="game" size={18} />
              {busy ? 'Cambiando de juego…' : 'Cerrar sesión y empezar'}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
