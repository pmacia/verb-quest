import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import { resumeSession } from '../learning-engine/session-service';
import { templates, resolvePlanSelection } from '../study-plans/plan-service';
import { SessionShell } from './SessionShell';
import { Icon } from '../../shared/ui/Icon';
import { usePlanStarter } from '../study-plans/use-plan-starter';
import { PlanLibrary } from '../study-plans/PlanLibrary';
import { sourceLabel, practiceLabel, withExamList } from '../study-plans/plan-presentation';
import { recentStudyPlans } from '../study-plans/recent-plans';
import { toLocalDate } from '../../shared/time/calendar';
export function StudyPage() {
  const { sessions, plans, profile, repos, refresh, verbs, lists, progress, settings } = useApp();
  const [search] = useSearchParams();
  const starter = usePlanStarter();
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
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
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
  const recent = recentStudyPlans({
    verbs,
    lists,
    plans,
    sessions,
    progress,
    today: toLocalDate(new Date().toISOString(), settings.timeZone),
    strictIpa: settings.strictIpa === true,
  });
  const plan =
    plans.find((p) => p.id === search.get('plan')) ??
    templates.find((p) => p.id === search.get('plan')) ??
    recent[0]?.plan ??
    plans[0] ??
    templates[0];
  const examList =
    plan.isTemplate && plan.id === 'template-exam'
      ? search.has('list')
        ? search.get('list') || undefined
        : recent.find((r) => r.plan.id === plan.id)?.listId
      : undefined;
  const continuing = recent.find(
    (r) => r.plan.id === plan.id && (plan.id !== 'template-exam' || r.listId === examList),
  );
  const effective = withExamList(plan, examList);
  const count = resolvePlanSelection(effective, {
    verbs,
    lists,
    progress,
    today: toLocalDate(new Date().toISOString(), settings.timeZone),
    strictIpa: settings.strictIpa === true,
  }).verbIds.length;
  const customUrl = `/plans/${plan.id}${examList ? `?list=${encodeURIComponent(examList)}` : ''}`;
  return (
    <div className="study-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">HOY ES UN BUEN DÍA PARA RECORDAR</span>
          <h1>
            Un pequeño paso adelante<span className="dot">.</span>
          </h1>
          <p>Elige qué quieres practicar. Primero lo pendiente; después, algo nuevo.</p>
        </div>
        <Link className="button secondary" to="/plans">
          <Icon name="settings" size={16} />
          Gestionar planes
        </Link>
      </div>
      <section className="sp-next-session" aria-label="Tu próxima sesión">
        <div>
          <span className="eyebrow">{continuing ? 'SIGUE CON TU PLAN' : 'TU PRÓXIMA SESIÓN'}</span>
          <h2>{plan.name}</h2>
          {continuing && (
            <p className="sp-resume-note">
              Tu progreso se conserva. Vas a preparar otra sesión del mismo plan.
            </p>
          )}
          <p>
            {sourceLabel(effective, lists)} · {count} {count === 1 ? 'verbo' : 'verbos'} en la
            selección
          </p>
          <div className="sp-next-facts">
            <span>
              <Icon name="clock" size={14} />
              {plan.schedule.minutesPerSession} min orientativos
            </span>
            <span>{practiceLabel(plan)}</span>
          </div>
          {!count && (
            <p className="sp-empty-reason">
              {plan.id === 'template-exam'
                ? 'Elige una lista en la tarjeta de Preparación de examen.'
                : 'No hay verbos activos para este plan. Puedes personalizarlo o elegir otra propuesta.'}
            </p>
          )}
        </div>
        <div className="sp-next-actions">
          <button
            disabled={!!starter.startingId || !count}
            onClick={() => void starter.start(plan, examList)}
          >
            <Icon name="play" size={16} />
            Comenzar sesión
          </button>
          <Link to={customUrl} className="button secondary">
            <Icon name="edit" size={15} />
            {plan.isTemplate ? 'Personalizar' : 'Editar plan'}
          </Link>
        </div>
      </section>
      {(error || starter.error) && (
        <p className="notice" role="alert">
          {error || starter.error}
        </p>
      )}
      <PlanLibrary
        startingId={starter.startingId}
        onStart={(plan, listId) => void starter.start(plan, listId)}
      />
      <Link className="sp-games-link" to="/games">
        ¿Prefieres elegir un juego? <Icon name="arrow" size={15} />
      </Link>
    </div>
  );
}
