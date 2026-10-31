import { Link } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import { toLocalDate } from '../../shared/time/calendar';
import { deriveVisibleState } from '../learning-engine/progress';
import { skillLabels, stateLabels, summarizeVerb } from './selectors';
import { Icon } from '../../shared/ui/Icon';
const awardLabels: Record<string, string> = {
  explorer: 'Explorador',
  listener: 'Oído atento',
  memory: 'Buena memoria',
  spelling: 'Buena ortografía',
  context: 'En contexto',
};
export function ProgressPage() {
  const { progress, settings, verbs, awards, xp } = useApp();
  const today = toLocalDate(new Date().toISOString(), settings.timeZone);
  const due = progress.filter((p) => deriveVisibleState(p, today) === 'needs_review');
  const total = xp.reduce((n, x) => n + x.points, 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LO QUE APRENDES SE QUEDA CONTIGO</span>
          <h1>
            Mira cuánto has avanzado<span className="dot">.</span>
          </h1>
          <p>Cada habilidad tiene su propio camino. Una visita o un sello no significan dominio.</p>
        </div>
        <Link className="button" to="/study">
          Seguir practicando <Icon name="arrow" size={18} />
        </Link>
      </div>
      <div className="stats-grid">
        {[
          [new Set(progress.map((p) => p.verbId)).size, 'Verbos explorados', 'book'],
          [due.length, 'Habilidades por repasar', 'clock'],
          [total, 'Puntos de experiencia', 'bolt'],
        ].map(([n, l, icon]) => (
          <section className="panel stat" key={l}>
            <span className="stat-icon">
              <Icon name={String(icon)} />
            </span>
            <div>
              <strong>{n}</strong>
              <small>{l}</small>
            </div>
          </section>
        ))}
      </div>
      <div className="detail-columns">
        <section className="panel">
          <h2>Cinco formas de hacerlo tuyo</h2>
          <p className="small">Dominio por habilidad evaluable. Pronunciación: sin evaluar.</p>
          <div className="progress-bars">
            {Object.entries(skillLabels)
              .filter(([s]) => s !== 'pronunciation')
              .map(([skill, label]) => {
                const n = progress.filter(
                  (p) => p.skill === skill && deriveVisibleState(p, today) === 'mastered',
                ).length;
                return (
                  <div key={skill}>
                    <div className="row">
                      <strong className="small">{label}</strong>
                      <span className="small muted">
                        {n} de {verbs.filter((v) => !v.archivedAt).length} verbos
                      </span>
                    </div>
                    <progress
                      max={Math.max(verbs.filter((v) => !v.archivedAt).length, 1)}
                      value={n}
                      aria-label={`Dominio de ${label}`}
                    />
                  </div>
                );
              })}
          </div>
        </section>
        <section className="panel">
          <h2>Tu colección de sellos</h2>
          {!awards.length ? (
            <div className="empty">
              <Icon name="star" size={40} />
              <p>Explora una ficha para conseguir tu primer sello.</p>
              <Link to="/verbs">Descubrir verbos →</Link>
            </div>
          ) : (
            awards.map((a) => (
              <div className="skill-row" key={a.id}>
                <span>
                  <strong>{awardLabels[a.kind] ?? a.kind}</strong>
                  <small style={{ display: 'block' }}>{a.verbId}</small>
                </span>
                <span className="tag">
                  {['explorer', 'listener'].includes(a.kind) ? 'Actividad' : 'Dominio'}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
      <div className="section-heading">
        <h2>Tu progreso, verbo a verbo</h2>
      </div>
      <section className="panel">
        {!progress.length && <p>Todavía no hay evidencia. Empieza por un juego o una ficha.</p>}
        {verbs
          .filter((v) => progress.some((p) => p.verbId === v.id))
          .map((v) => (
            <article className="example" key={v.id}>
              <div className="row">
                <Link className="verb-base" to={`/verbs/${v.id}`}>
                  {v.lemma}
                  {v.archivedAt ? ' · archivado' : ''}
                </Link>
                <small>
                  {
                    summarizeVerb(
                      progress.filter((p) => p.verbId === v.id),
                      today,
                    ).label
                  }
                </small>
              </div>
              {progress
                .filter((p) => p.verbId === v.id)
                .map((p) => (
                  <div className="skill-row" key={p.skill}>
                    <span>
                      {skillLabels[p.skill]}
                      <small className="muted" style={{ display: 'block' }}>
                        Cobertura: {p.coverage.length} objetivos · {p.stage} avances
                      </small>
                    </span>
                    <span>
                      {stateLabels[deriveVisibleState(p, today)]}
                      <small className="muted" style={{ display: 'block', textAlign: 'right' }}>
                        Próximo repaso: {p.dueDate ?? 'sin programar'}
                      </small>
                    </span>
                  </div>
                ))}
            </article>
          ))}
      </section>
    </>
  );
}
