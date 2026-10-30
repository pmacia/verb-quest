import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppProviders';
import { startSession } from '../learning-engine/session-service';
import { systemClock } from '../../shared/time/clock';
import { Icon } from '../../shared/ui/Icon';
import type { QuestionMode, EvaluatedSkill } from '../../shared/domain/types';
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
];
export function GamesPage() {
  const { lists, plans, verbs, repos, profile, refresh } = useApp();
  const [scope, setScope] = useState('all');
  const [manual, setManual] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
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
      {error && (
        <div role="alert" className="notice">
          {error}
          <p>
            <a href="/study">Continuar mi sesión pendiente →</a>
          </p>
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
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  const ids =
                    scope === 'manual'
                      ? manual
                      : scope === 'all'
                        ? verbs.filter((v) => !v.archivedAt).map((v) => v.id)
                        : (lists.find((l) => l.id === scope)?.verbIds ?? []);
                  await startSession(
                    repos,
                    {
                      kind: 'free',
                      ...(scope.startsWith('plan:') ? { planId: scope.slice(5) } : {}),
                      profileId: profile.id,
                      verbIds: ids,
                      modes: [g.mode],
                      skills: g.skills,
                    },
                    systemClock,
                    Math.random,
                  );
                  await refresh();
                  navigate('/study');
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Jugar ahora <Icon name="arrow" size={18} />
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
