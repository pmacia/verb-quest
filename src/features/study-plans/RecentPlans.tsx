import { Link } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import { Icon } from '../../shared/ui/Icon';
import { planIcon } from './plan-presentation';
import type { RecentStudyPlan } from './recent-plans';
import './recent-plans.css';
export function RecentPlans({ plans }: { plans: RecentStudyPlan[] }) {
  const { settings } = useApp();
  if (!plans.length) return null;
  return (
    <section aria-labelledby="recent-plans-title" className="recent-plans">
      <div className="section-heading">
        <h2 id="recent-plans-title">Planes recientes</h2>
        <Link to="/plans">
          Ver planes <Icon name="arrow" size={15} />
        </Link>
      </div>
      <div className="rp-list">
        {plans.slice(0, 3).map((recent) => (
          <article className="panel rp-plan" key={recent.key}>
            <span className="rp-icon">
              <Icon name={planIcon(recent.plan)} size={20} />
            </span>
            <div className="rp-content">
              <h3>{recent.title}</h3>
              <div className="rp-facts">
                <span>
                  {recent.practiced} de {recent.verbIds.length} verbos practicados
                </span>
                <span>
                  Última sesión:{' '}
                  {new Intl.DateTimeFormat('es', {
                    day: 'numeric',
                    month: 'short',
                    timeZone: settings.timeZone,
                  }).format(new Date(recent.lastUsedAt))}
                </span>
              </div>
              <p className="rp-review">
                {recent.needsList
                  ? 'Elige de nuevo la lista para seguir.'
                  : recent.due
                    ? `${recent.due} ${recent.due === 1 ? 'repaso pendiente' : 'repasos pendientes'}`
                    : recent.nextReview
                      ? `Próximo repaso: ${recent.nextReview}`
                      : 'Puedes continuar con otra sesión del plan.'}
              </p>
            </div>
            <Link
              className="button secondary rp-action"
              to={recent.href}
              aria-label={`${recent.needsList ? 'Elegir lista para' : 'Retomar'} ${recent.title}`}
            >
              <Icon name={recent.needsList ? 'edit' : 'play'} size={15} />
              {recent.needsList ? 'Elegir lista' : 'Retomar'}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
