import { Link } from 'react-router-dom';
import { useApp } from './app-context';
import { Icon } from '../shared/ui/Icon';
import { toLocalDate } from '../shared/time/calendar';
import { progressSummary } from '../features/progress/progress-model';
import { ProgressStats } from '../features/progress/ProgressStats';
import { RecentPlans } from '../features/study-plans/RecentPlans';
import { recentStudyPlans } from '../features/study-plans/recent-plans';
import { gameCards } from '../features/games/GamesPage';
export function HomePage() {
  const { verbs, progress, settings, sessions, xp, plans, lists } = useApp();
  const today = toLocalDate(new Date().toISOString(), settings.timeZone);
  const summary = progressSummary(verbs, progress, today);
  const due = summary.due.length;
  const active = sessions.find((s) => s.status !== 'completed');
  const practiced = summary.practicedIds.size;
  const recent = recentStudyPlans({
    verbs,
    lists,
    plans,
    sessions,
    progress,
    today,
    strictIpa: settings.strictIpa === true,
  });
  const latest = recent[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TU AVENTURA EMPIEZA CON UN PASO</span>
          <h1>
            Hola, explorador<span className="dot">.</span>
          </h1>
          <p>Unos minutos hoy. Un poco más de confianza mañana.</p>
        </div>
        <span className="tag">APRENDE A TU RITMO</span>
      </div>
      <section className="hero" aria-label="Tu próxima aventura">
        <div className="hero-content">
          <span className="eyebrow">
            {active
              ? 'TU MISIÓN SIGUE AQUÍ'
              : latest
                ? 'TU PLAN SIGUE CONTIGO'
                : due
                  ? 'HOY TOCA VOLVER A RECORDAR'
                  : '¿LISTO PARA UN NUEVO DESCUBRIMIENTO?'}
          </span>
          <h2 className="hero-headline">
            {active
              ? 'Sigamos donde lo dejaste.'
              : latest
                ? 'Sigamos con tu plan.'
                : due
                  ? 'Dale otra vuelta a lo aprendido.'
                  : 'Los grandes progresos empiezan en pequeño.'}
          </h2>
          <p>
            {active
              ? `${active.attemptIds.length} respuestas guardadas. Continúa sin empezar de cero.`
              : latest
                ? `${latest.title}. Tu progreso está guardado. ${latest.needsList ? 'Elige la lista para preparar la siguiente sesión.' : latest.due ? `${latest.due} repasos pendientes en este plan.` : 'Continúa con tu próxima sesión cuando quieras.'}`
                : due
                  ? `${due} habilidades necesitan refuerzo. Tu próxima sesión les dará prioridad.`
                  : `Tu próxima misión: ${settings.minutes} minutos para descubrir nuevas formas y practicar lo que sabes.`}
          </p>
          <Link className="button" to={active ? '/study' : (latest?.href ?? '/study')}>
            {active
              ? 'Continuar mi sesión'
              : latest
                ? latest.needsList
                  ? 'Elegir lista'
                  : 'Continuar con mi plan'
                : 'Empezar a estudiar'}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <strong>go</strong>
          <span>went</span>
          <span>gone</span>
          <small>✦</small>
        </div>
      </section>
      <ProgressStats
        practiced={practiced}
        due={due}
        points={xp.reduce((n, a) => n + a.points, 0)}
      />
      <RecentPlans plans={recent} />
      <div className="section-heading">
        <h2>Elige cómo descubrir</h2>
        <Link to="/games">Ver todos los juegos →</Link>
      </div>
      <div className="cards-grid">
        {gameCards.slice(0, 3).map((g, i) => (
          <article className="panel game-card" key={g.mode}>
            <span
              className="game-icon"
              style={{
                background: i === 1 ? '#e9f8f3' : i === 2 ? '#f0ecff' : undefined,
                color: i === 1 ? '#177363' : i === 2 ? '#6651b4' : undefined,
              }}
            >
              <Icon name={g.icon} size={26} />
            </span>
            <h2>{g.title}</h2>
            <p>{g.description}</p>
            <Link to="/games" className="text-button">
              Vamos a jugar <Icon name="arrow" size={16} />
            </Link>
          </article>
        ))}
      </div>
      <div className="section-heading">
        <h2>Siempre hay algo por explorar</h2>
        <Link to="/verbs">Ir a la biblioteca →</Link>
      </div>
      <div className="panel row wrap">
        <div>
          <h3 style={{ marginBottom: 4 }}>
            {verbs.filter((v) => !v.archivedAt).length} verbos, muchas historias
          </h3>
          <p className="small" style={{ margin: 0 }}>
            Busca una forma, descubre su patrón y hazla parte de tu próxima lista.
          </p>
        </div>
        <Link to="/verbs" className="button secondary">
          <Icon name="book" size={18} />
          Explorar biblioteca
        </Link>
      </div>
    </>
  );
}
