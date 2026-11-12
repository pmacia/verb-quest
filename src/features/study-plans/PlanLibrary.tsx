import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import { templates, resolvePlanSelection } from './plan-service';
import { planIcon, planTone, sourceLabel, practiceLabel, withExamList } from './plan-presentation';
import { Icon } from '../../shared/ui/Icon';
import { toLocalDate } from '../../shared/time/calendar';
import type { StudyPlan } from '../../shared/domain/types';
import './study-plans.css';
export function PlanLibrary({
  onStart,
  startingId,
}: {
  onStart: (plan: StudyPlan, listId?: string) => void;
  startingId: string | null;
}) {
  const { verbs, lists, plans, progress, settings } = useApp();
  const [listId, setListId] = useState('');
  const context = {
    verbs,
    lists,
    progress,
    strictIpa: settings.strictIpa === true,
    today: toLocalDate(new Date().toISOString(), settings.timeZone),
  };
  function card(plan: StudyPlan) {
    const exam = plan.isTemplate && plan.id === 'template-exam';
    const selectedList = exam && lists.some((list) => list.id === listId) ? listId : undefined;
    const effective = withExamList(plan, selectedList);
    const count = resolvePlanSelection(effective, context).verbIds.length;
    const customUrl = `/plans/${plan.id}${exam && selectedList ? `?list=${encodeURIComponent(selectedList)}` : ''}`;
    return (
      <article
        className={`sp-plan-card sp-tone-${planTone(plan)}`}
        key={plan.id}
        id={plan.id}
        aria-label={plan.name}
      >
        <div className="sp-card-top">
          <span className="sp-plan-icon">
            <Icon name={planIcon(plan)} size={21} />
          </span>
          <span className="sp-time">
            <Icon name="clock" size={12} />
            {plan.schedule.minutesPerSession} min
          </span>
          {!plan.isTemplate && <span className="sp-personal-tag">Personal</span>}
        </div>
        <h3>{plan.name}</h3>
        <p className="sp-description">
          {plan.description || 'Tu selección y tus objetivos, a tu ritmo.'}
        </p>
        <div className="sp-plan-facts">
          <span>
            <Icon name="book" size={13} />
            {sourceLabel(effective, lists)}
          </span>
          <span>
            <Icon name="chart" size={13} />
            {practiceLabel(plan)}
          </span>
        </div>
        {exam && lists.length > 0 && (
          <label className="sp-exam-list">
            Lista para el examen
            <select
              aria-label="Lista para Preparación de examen"
              value={selectedList ?? ''}
              onChange={(e) => setListId(e.target.value)}
            >
              <option value="">Elige una lista</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="sp-selection-summary">
          <strong>{count}</strong>{' '}
          {count === 1 ? 'verbo en la selección' : 'verbos en la selección'}
          <span>Hasta {plan.schedule.newVerbsPerSession} nuevos por sesión</span>
        </div>
        {!count && (
          <p className="sp-empty-reason">
            {exam
              ? lists.length
                ? 'Elige una lista con verbos activos.'
                : 'Guarda primero una lista desde el catálogo.'
              : plan.id === 'template-difficult'
                ? 'Cuando un verbo necesite refuerzo, aparecerá en este plan.'
                : 'No hay verbos activos que coincidan. Puedes ajustar la selección.'}
          </p>
        )}
        <div className="sp-card-actions">
          <button
            type="button"
            disabled={!!startingId || !count}
            onClick={() => onStart(plan, selectedList)}
            aria-label={`Empezar ${plan.name}`}
          >
            <Icon name="play" size={15} />
            {startingId === plan.id ? 'Preparando…' : 'Empezar'}
          </button>
          <Link
            to={customUrl}
            className="button secondary"
            aria-label={`${plan.isTemplate ? 'Personalizar' : 'Editar'} ${plan.name}`}
          >
            <Icon name="edit" size={15} />
            {plan.isTemplate ? 'Personalizar' : 'Editar'}
          </Link>
          {exam && !lists.length && (
            <Link className="sp-create-list" to="/verbs">
              Crear lista
            </Link>
          )}
        </div>
      </article>
    );
  }
  return (
    <div className="sp-plan-library">
      <section aria-labelledby="personal-plans-title">
        <div className="sp-section-heading">
          <h2 id="personal-plans-title">
            <Icon name="save" size={18} />
            Mis planes
          </h2>
          <Link to="/plans/new" className="text-button">
            <Icon name="plus" size={15} />
            Crear plan
          </Link>
        </div>
        {plans.length ? (
          <div className="sp-plan-grid">{plans.map(card)}</div>
        ) : (
          <p className="sp-personal-empty">
            Todavía no has guardado un plan propio. Puedes personalizar cualquiera de las propuestas
            de abajo.
          </p>
        )}
      </section>
      <section aria-labelledby="prepared-plans-title">
        <div className="sp-section-heading">
          <h2 id="prepared-plans-title">
            <Icon name="study" size={18} />
            Planes preparados
          </h2>
          <span>Empieza directamente o adáptalos</span>
        </div>
        <h3 className="sp-group-title">Por objetivo</h3>
        <div className="sp-plan-grid">
          {templates.filter((p) => p.source.type !== 'course').map(card)}
        </div>
        <h3 className="sp-group-title">Por curso de ESO</h3>
        <p className="sp-course-note">
          Selecciones acumulativas y orientativas; puedes adaptarlas a tu clase.
        </p>
        <div className="sp-plan-grid">
          {templates.filter((p) => p.source.type === 'course').map(card)}
        </div>
      </section>
    </div>
  );
}
