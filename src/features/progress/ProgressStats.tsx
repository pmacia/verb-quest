import { Link } from 'react-router-dom';
import { Icon } from '../../shared/ui/Icon';
import './progress.css';
export function ProgressStats({
  practiced,
  due,
  points,
  scope = 'all',
}: {
  practiced: number;
  due: number;
  points: number;
  scope?: string;
}) {
  const target = (view: string) => `/progress?${new URLSearchParams({ scope, view })}`;
  return (
    <div className="stats-grid progress-stats">
      {[
        { count: practiced, label: 'Verbos practicados', icon: 'book', view: 'practiced' },
        { count: due, label: 'Repasos pendientes', icon: 'clock', view: 'due' },
      ].map((item) => (
        <Link
          className="panel stat progress-stat-link"
          key={item.view}
          to={target(item.view)}
          title={
            item.view === 'due'
              ? 'Ver las habilidades pendientes de repaso'
              : 'Ver los verbos que has practicado'
          }
        >
          <span className="stat-icon">
            <Icon name={item.icon} size={24} />
          </span>
          <div>
            <strong>{item.count}</strong>
            <small>{item.label}</small>
          </div>
          <Icon name="arrow" size={16} />
        </Link>
      ))}
      <div className="panel stat" title="Puntos totales de tu aventura, en todos los planes">
        <span className="stat-icon">
          <Icon name="bolt" size={24} />
        </span>
        <div>
          <strong>{points}</strong>
          <small>XP de tu aventura</small>
        </div>
      </div>
    </div>
  );
}
