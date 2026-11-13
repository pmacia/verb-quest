import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import { toLocalDate } from '../../shared/time/calendar';
import { deriveVisibleState } from '../learning-engine/progress';
import { skillLabels, stateLabels, summarizeVerb } from './selectors';
import { Icon } from '../../shared/ui/Icon';
import { ProgressStats } from './ProgressStats';
import { currentPlanContext, progressSummary } from './progress-model';
import { resolvePlanSelection, templates } from '../study-plans/plan-service';
const awardLabels: Record<string, string> = {
  explorer: 'Explorador',
  listener: 'Oído atento',
  memory: 'Buena memoria',
  spelling: 'Buena ortografía',
  context: 'En contexto',
};
export function ProgressPage() {
  const { progress, settings, verbs, awards, xp, plans, sessions, lists } = useApp();
  const [search, setSearch] = useSearchParams();
  const today = toLocalDate(new Date().toISOString(), settings.timeZone);
  const context = {
    verbs,
    lists,
    progress,
    today,
    strictIpa: settings.strictIpa === true,
    plans,
    sessions,
  };
  const current = currentPlanContext(context);
  const options = [...plans, ...templates];
  const selectedPlan = options.find((p) => p.id === search.get('scope'));
  const scope = search.get('scope') === 'current' ? 'current' : (selectedPlan?.id ?? 'all');
  const selection =
    scope === 'current'
      ? current.verbIds
      : selectedPlan
        ? resolvePlanSelection(selectedPlan, context).verbIds
        : undefined;
  const summary = progressSummary(
    selection ? verbs.filter((v) => selection.includes(v.id)) : verbs,
    progress,
    today,
  );
  const view = ['practiced', 'due'].includes(search.get('view') ?? '')
    ? search.get('view')!
    : 'all';
  const displayedRecords = view === 'due' ? summary.due : summary.records;
  const displayedVerbs = summary.verbs.filter((v) =>
    view === 'due' ? summary.due.some((p) => p.verbId === v.id) : summary.practicedIds.has(v.id),
  );
  const scopeName =
    scope === 'all'
      ? 'Biblioteca completa'
      : scope === 'current'
        ? current.name
        : selectedPlan!.name;
  const scopedAwards = awards.filter(
    (a) => scope === 'all' || (a.verbId && summary.verbs.some((v) => v.id === a.verbId)),
  );
  function change(key: string, value: string) {
    setSearch((prev) => {
      const next = new URLSearchParams(prev);
      next.set(key, value);
      return next;
    });
  }
  const total = xp.reduce((n, x) => n + x.points, 0);
  const details = (
    <section aria-label="Detalle del progreso">
      <div className="section-heading">
        <h2>
          {view === 'due'
            ? 'Repasos pendientes'
            : view === 'practiced'
              ? 'Verbos practicados'
              : 'Tu progreso, verbo a verbo'}
        </h2>
      </div>
      <section className="panel">
        {!displayedVerbs.length && (
          <p>
            {view === 'due'
              ? 'No hay repasos pendientes en esta selección.'
              : 'Todavía no has practicado verbos en esta selección. Empieza por una sesión de estudio.'}
          </p>
        )}
        {displayedVerbs.map((v) => (
          <article className="example" key={v.id}>
            <div className="row">
              <Link className="verb-base" to={`/verbs/${v.id}`}>
                {v.lemma}
                {v.archivedAt ? ' · archivado' : ''}
              </Link>
              <small>
                {
                  summarizeVerb(
                    summary.records.filter((p) => p.verbId === v.id),
                    today,
                  ).label
                }
              </small>
            </div>
            {displayedRecords
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
    </section>
  );
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
      <section className="panel" aria-label="Ámbito del progreso">
        <div className="progress-toolbar">
          <label>
            Progreso de
            <select value={scope} onChange={(e) => change('scope', e.target.value)}>
              <option value="all">Biblioteca completa</option>
              <option value="current">Plan actual · {current.name}</option>
              {plans.length > 0 && (
                <optgroup label="Mis planes">
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Planes preparados">
                {templates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <label>
            Mostrar
            <select value={view} onChange={(e) => change('view', e.target.value)}>
              <option value="all">Todo el progreso</option>
              <option value="practiced">Verbos practicados</option>
              <option value="due">Repasos pendientes</option>
            </select>
          </label>
        </div>
        <p className="progress-scope-note" role="status">
          <strong>{scopeName}</strong> · {summary.verbs.length} verbos activos.{' '}
          {scope === 'current'
            ? current.note
            : scope === 'all'
              ? 'No se incluyen verbos archivados; su historial se conserva.'
              : 'Selección completa con la configuración actual del plan.'}{' '}
          Los repasos se cuentan por habilidad; los XP son el total de tu aventura.
        </p>
        {selectedPlan?.id === 'template-exam' && !selection?.length && (
          <p className="notice">
            Este plan necesita una lista. Elígela en{' '}
            <Link to="/study?plan=template-exam">Estudio</Link> e inicia la sesión; después podrás
            consultar su progreso en «Plan actual».
          </p>
        )}
      </section>
      <ProgressStats
        practiced={summary.practicedIds.size}
        due={summary.due.length}
        points={total}
        scope={scope}
      />
      {view !== 'all' && details}
      <div className="detail-columns">
        <section className="panel">
          <h2>Cinco formas de hacerlo tuyo</h2>
          <p className="small">
            Dominio por habilidad evaluable · {scopeName}. Pronunciación: sin evaluar.
          </p>
          <div className="progress-bars">
            {Object.entries(skillLabels)
              .filter(([s]) => s !== 'pronunciation')
              .map(([skill, label]) => {
                const n = summary.mastered[skill];
                return (
                  <div key={skill}>
                    <div className="row">
                      <strong className="small">{label}</strong>
                      <span className="small muted">
                        {n} de {summary.verbs.length} verbos
                      </span>
                    </div>
                    <progress
                      max={Math.max(summary.verbs.length, 1)}
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
          {!scopedAwards.length ? (
            <div className="empty">
              <Icon name="star" size={40} />
              <p>Explora una ficha para conseguir tu primer sello.</p>
              <Link to="/verbs">Descubrir verbos →</Link>
            </div>
          ) : (
            scopedAwards.map((a) => (
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
      {view === 'all' && details}
    </>
  );
}
