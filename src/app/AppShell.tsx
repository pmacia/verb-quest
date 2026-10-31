import { UpdateNotice } from './UpdateNotice';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useApp } from './app-context';
import { Icon } from '../shared/ui/Icon';
import { useEffect, useRef } from 'react';
import { dataset } from '../content/dataset';
const nav = [
  ['/', 'home', 'Inicio'],
  ['/verbs', 'book', 'Verbos'],
  ['/study', 'study', 'Estudiar'],
  ['/games', 'game', 'Juegos'],
  ['/progress', 'chart', 'Progreso'],
];
export function AppShell() {
  const { xp } = useApp();
  const location = useLocation();
  const ref = useRef<HTMLElement>(null);
  const total = xp.reduce((n, x) => n + x.points, 0);
  useEffect(() => {
    ref.current?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            V<span>✦</span>
          </span>
          <span>
            Verb<span className="brand-light">Quest</span>
            <small>UN POCO MEJOR CADA DÍA</small>
          </span>
        </Link>
        <div className="nav-caption">TU ESPACIO DE APRENDIZAJE</div>
        <nav aria-label="Navegación principal">
          {nav.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="level-card">
            <span className="level-icon">
              <Icon name="bolt" />
            </span>
            <div>
              <strong>Nivel {1 + Math.floor(total / 100)}</strong>
              <small>{total} XP · Sigue explorando</small>
            </div>
            <progress value={total % 100} max="100" aria-label="Progreso de nivel" />
          </div>
          <NavLink to="/settings" className="settings-link">
            <Icon name="settings" />
            Configuración
          </NavLink>
          <p>
            Tu progreso se guarda
            <br />
            en este navegador.
          </p>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span className="breadcrumb">
            MI AVENTURA{' '}
            <span>
              /{' '}
              {nav.find(([to]) =>
                to === '/' ? location.pathname === '/' : location.pathname.startsWith(to),
              )?.[2] ?? 'Biblioteca'}
            </span>
          </span>
          <div className="top-actions">
            <span className="local-status">
              <i /> En este navegador
            </span>
            <Link className="avatar" to="/settings" aria-label="Abrir configuración">
              TÚ
            </Link>
          </div>
        </header>
        <main id="main" tabIndex={-1} ref={ref}>
          {dataset.kind === 'fixture' && (
            <div className="fixture-notice">
              Edición de desarrollo · 8 verbos de prueba pendientes de revisión lingüística.
            </div>
          )}
          <Outlet />
          <UpdateNotice />
        </main>
        <footer className="page-footer">
          Pequeños pasos, grandes progresos.<span>VerbQuest · Aprende a tu ritmo</span>
        </footer>
      </div>
    </div>
  );
}
