import ipaReview from '../../content/enrichment-review.json';
import { patternLabel, topicLabel } from '../catalog/classification-labels';
import { useEffect } from 'react';
import { recordActivity } from '../gamification/awards';
import { skillLabels, stateLabels } from '../progress/selectors';
import { deriveVisibleState } from '../learning-engine/progress';
import { toLocalDate } from '../../shared/time/calendar';
import { AudioControls } from '../audio/AudioControls';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../app/AppProviders';
import { formValues } from '../catalog/query';
import { toggleListVerb } from '../catalog/list-service';
import { StatusPanel } from '../../shared/ui/StatusPanel';
import { Icon } from '../../shared/ui/Icon';
import { useState } from 'react';
export function VerbDetailPage() {
  const { id } = useParams();
  const { verbs, lists, repos, profile, refresh, progress, settings } = useApp();
  const [error, setError] = useState('');
  const v = verbs.find((v) => v.id === id);
  useEffect(() => {
    if (v)
      void recordActivity(repos, {
        kind: 'opened',
        profileId: profile.id,
        verbId: v.id,
        at: new Date().toISOString(),
      }).catch((e) => setError(String(e)));
  }, [id]);
  if (!v) return <StatusPanel title="No encontramos este verbo" />;
  const ipaSources = [
    ...new Set(ipaReview.reviewed.filter((r) => r.verbId === v.id).map((r) => r.source)),
  ];
  return (
    <>
      <Link to="/verbs" className="back-link">
        ← Volver a la biblioteca
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">UN VERBO, MUCHAS POSIBILIDADES</span>
          <h1 className="verb-title">
            {v.lemma}
            <span className="dot">.</span>
          </h1>
          <p className="large">{v.meanings.join(' · ')}</p>
        </div>
        <Link to={`/editor/verbs/${id}`} className="button secondary">
          Editar ficha
        </Link>
      </div>
      {v.archivedAt && (
        <div className="notice">Este verbo está archivado. Su historial se conserva.</div>
      )}
      <div className="forms-grid">
        {(['base', 'pastSimple', 'pastParticiple'] as const).map((f, i) => (
          <section className="panel form-card" key={f}>
            <span className="eyebrow">
              {['FORMA BASE', 'PASADO SIMPLE', 'PARTICIPIO PASADO'][i]}
            </span>
            <h2>{formValues(v, f).join(' / ')}</h2>
            <div className="pronunciation-list">
              {(f === 'base' ? [v.forms.base] : v.forms[f].variants).map((form) => {
                const entries = (
                  [settings.dialect, settings.dialect === 'uk' ? 'us' : 'uk'] as const
                ).flatMap((dialect) => {
                  const p = form.pronunciation?.[dialect];
                  return p?.ipa ? [{ dialect, p }] : [];
                });
                return (
                  <div key={form.value}>
                    {entries.length ? (
                      entries.map(({ dialect, p }) => (
                        <div key={dialect}>
                          {p.validated ? (
                            <p>
                              {form.value} · IPA {dialect.toUpperCase()}: {p.ipa}
                            </p>
                          ) : (
                            <div className="small muted">
                              <span className="tag">IPA propuesta · pendiente de revisión</span>
                              <p>
                                {form.value} · {dialect.toUpperCase()}: {p.ipa}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="small muted">{form.value}: IPA no disponible con revisión</p>
                    )}
                  </div>
                );
              })}
              {f !== 'base' && (
                <p className="small muted">
                  {v.forms[f].variants
                    .map((a) => a.usageNote)
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
            {v.lemma === 'read' ? (
              <p className="small muted">
                Audio aislado desactivado: esta palabra necesita contexto para su pronunciación.
              </p>
            ) : (
              <AudioControls
                text={formValues(v, f).join(', ')}
                label={`Escuchar ${f} de ${v.lemma}`}
                onPlayed={() =>
                  void recordActivity(repos, {
                    kind: 'audio_completed',
                    profileId: profile.id,
                    verbId: v.id,
                    form: f,
                    at: new Date().toISOString(),
                  }).catch((e) => setError(String(e)))
                }
              />
            )}
          </section>
        ))}
      </div>
      <div className="detail-columns">
        <section className="panel">
          <h2>Del verbo a la frase</h2>
          <p className="muted">Descubre cómo cambia en cada contexto.</p>
          {v.examples.map((ex) => (
            <article className="example" key={ex.id}>
              <span className="tag">{ex.grammarPoint}</span>
              <h3 lang="en">{ex.sentence}</h3>
              <p>{ex.translation}</p>
              {ex.reviewStatus === 'validated' && (
                <small className="muted">{ex.source ?? 'Revisado por el editor local'}</small>
              )}
              {ex.reviewStatus !== 'validated' && (
                <small className="muted">Ejemplo de prueba · pendiente de revisión</small>
              )}
            </article>
          ))}
        </section>
        <aside>
          <section className="panel">
            <h2>Hazlo parte de tu plan</h2>
            <p>Guárdalo en una lista para practicarlo después.</p>
            {lists.map((l) => (
              <label className="check-row" key={l.id}>
                <input
                  type="checkbox"
                  checked={l.verbIds.includes(v.id)}
                  onChange={async () => {
                    try {
                      await toggleListVerb(repos, profile.id, l.id, v.id);
                      await refresh();
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                />
                {l.name}
              </label>
            ))}
            {!lists.length && <Link to="/verbs">Crea tu primera lista en la biblioteca →</Link>}
            {error && <p role="alert">{error}</p>}
          </section>
          <section className="panel">
            <h2>Una pista para aprender</h2>
            <div className="chips">
              {v.classification.patternGroups.map((g) => (
                <span className="tag" key={g}>
                  {patternLabel(g)}
                </span>
              ))}
            </div>
            <p className="small muted">
              Temas: {(v.classification.topics ?? []).map(topicLabel).join(' · ')}
            </p>
            {v.notes?.map((n) => (
              <p key={n}>{n}</p>
            ))}
            <p className="small muted">
              Curso orientativo:{' '}
              {v.classification.recommendedCourses.map((c) => c.replace('eso', '')).join(', ')} ESO.
            </p>
          </section>
          <section className="panel">
            <h2>Fuentes y revisión</h2>
            {ipaSources.map((url) => (
              <p key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  IPA · {url.split('/').at(-1)} (Cambridge)
                </a>
              </p>
            ))}
            <p className="small muted">
              La IPA propuesta procede del archivo aportado y está pendiente de contraste. Solo la
              marcada como validada interviene en los filtros fonéticos.
            </p>
            <p className="small">
              {v.contentVersion === 'curated-1.0'
                ? 'Contenido con revisión asistida. Los cursos son orientativos.'
                : 'Contenido del editor local.'}
            </p>
            {v.sources.map((source, i) => (
              <p className="small" key={i}>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.label ?? source.url}
                  </a>
                ) : (
                  source.label
                )}
              </p>
            ))}
          </section>
          <section className="panel">
            <h2>Tu progreso por habilidad</h2>
            {Object.entries(skillLabels).map(([skill, label]) => {
              const p = progress.find((p) => p.verbId === id && p.skill === skill);
              return (
                <div className="skill-row" key={skill}>
                  <span>{label}</span>
                  <span className="small muted">
                    {skill === 'pronunciation'
                      ? 'Sin evaluar'
                      : p
                        ? stateLabels[
                            deriveVisibleState(
                              p,
                              toLocalDate(new Date().toISOString(), settings.timeZone),
                            )
                          ]
                        : 'Sin evidencia'}
                  </span>
                </div>
              );
            })}
          </section>
        </aside>
      </div>
    </>
  );
}
