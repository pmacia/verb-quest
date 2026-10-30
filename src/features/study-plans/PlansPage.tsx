import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppProviders';
import { templates } from './plan-service';
import { Icon } from '../../shared/ui/Icon';
export function PlansPage() {
  const { plans } = useApp();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">UN CAMINO A TU MEDIDA</span>
          <h1>
            Tu próximo pequeño paso<span className="dot">.</span>
          </h1>
          <p>Elige un plan. Nosotros ponemos el orden, tú pones el ritmo.</p>
        </div>
        <Link to="/plans/new" className="button">
          <Icon name="plus" />
          Crear plan
        </Link>
      </div>
      {plans.length > 0 && (
        <>
          <div className="section-heading">
            <h2>Mis planes</h2>
          </div>
          <div className="cards-grid">
            {plans.map((p) => (
              <article className="panel game-card" key={p.id}>
                <span className="tag">{p.schedule.minutesPerSession} MIN · PERSONAL</span>
                <h2 style={{ marginTop: 18 }}>{p.name}</h2>
                <p>{p.goals.join(' · ')}</p>
                <Link className="button secondary" to={`/plans/${p.id}`}>
                  Continuar plan <Icon name="arrow" size={18} />
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
      <div className="section-heading">
        <h2>Encuentra tu punto de partida</h2>
        <span className="small muted">Siempre puedes adaptarlo</span>
      </div>
      <div className="cards-grid">
        {templates.map((p, i) => (
          <article className="panel game-card" key={p.id}>
            <span className="game-icon">
              <Icon name={i === 6 ? 'sound' : i === 8 ? 'bolt' : 'study'} size={26} />
            </span>
            <h2>{p.name}</h2>
            <p>{p.description}</p>
            <Link className="button secondary" to={`/plans/${p.id}`}>
              Elegir este plan <Icon name="arrow" size={18} />
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
