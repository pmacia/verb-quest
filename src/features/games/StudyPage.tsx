import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../app/AppProviders';
import { startSession, resumeSession, completeSession } from '../learning-engine/session-service';
import { systemClock } from '../../shared/time/clock';
import { templates } from '../study-plans/plan-service';
import { SessionShell } from './SessionShell';
import { Icon } from '../../shared/ui/Icon';
export function StudyPage() {
  const { sessions, plans, profile, repos, refresh, verbs } = useApp();
  const [search] = useSearchParams();
  const active = sessions.find((s) => s.status !== 'completed');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const archivedIds = verbs
    .filter((v) => v.archivedAt)
    .map((v) => v.id)
    .sort()
    .join(',');
  async function resume() {
    setBusy(true);
    setError('');
    try {
      await resumeSession(repos, profile.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (active) void resume();
  }, [active?.id, archivedIds]);
  const summary = sessions.find((s) => s.id === search.get('summary') && s.status === 'completed');
  if (summary) return <SessionShell key={summary.id} session={summary} />;
  if (active)
    return (
      <>
        {error && (
          <div role="alert" className="notice">
            {error}{' '}
            <button disabled={busy} onClick={() => void resume()}>
              Reintentar reanudación
            </button>
          </div>
        )}
        <SessionShell key={active.id} session={active} />
      </>
    );
  const plan = plans.find((p) => p.id === search.get('plan')) ?? plans[0] ?? templates[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">HOY ES UN BUEN DÍA PARA RECORDAR</span>
          <h1>
            Un pequeño paso adelante<span className="dot">.</span>
          </h1>
          <p>Primero lo pendiente. Después, algo nuevo.</p>
        </div>
        <Link className="button secondary" to="/plans">
          Cambiar de plan
        </Link>
      </div>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">TU PRÓXIMA SESIÓN</span>
          <h2 className="hero-headline">{plan.name}</h2>
          <p>
            {plan.schedule.minutesPerSession} minutos orientativos · hasta{' '}
            {plan.schedule.newVerbsPerSession} verbos nuevos.
          </p>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await startSession(
                  repos,
                  { kind: 'plan', profileId: profile.id, planId: plan.id },
                  systemClock,
                  Math.random,
                );
                await refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Comenzar sesión <Icon name="arrow" size={18} />
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <strong>learn</strong>
          <span>learnt</span>
          <span>learnt</span>
        </div>
      </section>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <div className="stats-grid">
        {[
          ['clock', 'A tu ritmo', 'Sin cuenta atrás'],
          ['study', 'Repaso inteligente', 'Tus errores orientan el camino'],
          ['check', 'Cada habilidad cuenta', 'Evidencias separadas'],
        ].map(([icon, title, text]) => (
          <section className="panel" key={title}>
            <Icon name={icon} />
            <h2 style={{ marginTop: 14, fontSize: 16 }}>{title}</h2>
            <p className="small">{text}</p>
          </section>
        ))}
      </div>
      <Link to="/games">¿Prefieres elegir un juego? →</Link>
    </>
  );
}
