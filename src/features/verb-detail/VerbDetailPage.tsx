import '../catalog/catalog-design.css';
import { VerbForms } from '../catalog/VerbForms';
import { VerbBadges } from '../catalog/VerbBadges';
import { useCatalogAudio } from '../catalog/use-catalog-audio';
import { pronunciationReview, reviewedSources } from '../../content/pronunciation-review';
import { IpaHelpButton } from '../phonetics/IpaHelpButton';
import { patternLabel, topicLabel } from '../catalog/classification-labels';
import { useEffect } from 'react';
import { recordActivity } from '../gamification/awards';
import { skillLabels, stateLabels } from '../progress/selectors';
import { deriveVisibleState } from '../learning-engine/progress';
import { toLocalDate } from '../../shared/time/calendar';
import { AudioControls } from '../audio/AudioControls';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import { toggleListVerb } from '../catalog/list-service';
import { StatusPanel } from '../../shared/ui/StatusPanel';
import { Icon } from '../../shared/ui/Icon';
import { useState } from 'react';
export function VerbDetailPage() {
  const { id } = useParams();
  const { verbs, entries, lists, repos, profile, refresh, progress, settings } = useApp();
  const [error, setError] = useState('');
  const v = verbs.find((v) => v.id === id);
  const audio = useCatalogAudio(v ? [v.id] : []);
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
  const ipaSources = reviewedSources(v, pronunciationReview);
  const pendingIpa = (['base', 'pastSimple', 'pastParticiple'] as const).some((form) =>
    (form === 'base' ? [v.forms.base] : v.forms[form].variants).some((value) =>
      (['uk', 'us'] as const).some((dialect) => !value.pronunciation?.[dialect]?.validated),
    ),
  );
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
          <VerbBadges verb={v} detailed />
        </div>
        <Link to={`/editor/verbs/${id}`} className="button secondary">
          Editar ficha
        </Link>
      </div>
      {v.archivedAt && (
        <div className="notice">Este verbo está archivado. Su historial se conserva.</div>
      )}
      <IpaHelpButton />
      <p className="catalog-audio-status" role="status">
        {audio.message}
      </p>
      <button
        type="button"
        className="secondary"
        aria-label={
          audio.playingKey === v.id
            ? `Detener audio de ${v.lemma}`
            : `Escuchar las tres formas de ${v.lemma}`
        }
        onClick={() => void audio.play(v)}
      >
        <Icon name="sound" size={18} />
        {audio.playingKey === v.id ? 'Detener audio' : 'Escuchar las tres formas'}
      </button>
      <VerbForms
        verb={v}
        translations
        playingKey={audio.playingKey}
        onPlay={(form, value, dialect) => void audio.play(v, form, value, dialect)}
      />
      <p className="small muted">Las traducciones pueden variar según la persona y el contexto.</p>
      <div className="detail-columns">
        <section className="panel">
          <h2>Del verbo a la frase</h2>
          <p className="muted">Descubre cómo cambia en cada contexto.</p>
          {v.examples.map((ex) => (
            <article className="example" key={ex.id}>
              <span className="tag">{ex.grammarPoint}</span>
              <div className="example-sentence">
                <h3 lang="en">{ex.sentence}</h3>
                <AudioControls
                  text={ex.sentence}
                  label={`Escuchar ejemplo: ${ex.sentence}`}
                  iconOnly
                />
              </div>
              <p>{ex.translation}</p>
              {settings.showSources && ex.reviewStatus === 'validated' && (
                <small className="muted">{ex.source ?? 'Revisado por el editor local'}</small>
              )}
              {settings.showSources && ex.reviewStatus !== 'validated' && (
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
          {settings.showSources && (
            <section className="panel">
              <h2>Fuentes y revisión</h2>
              {ipaSources.map((url) => (
                <p key={url}>
                  <a href={url} target="_blank" rel="noreferrer">
                    IPA ·{' '}
                    {new URL(url).hostname.includes('oxford')
                      ? 'Oxford'
                      : new URL(url).hostname.includes('britishcouncil')
                        ? 'British Council'
                        : 'Cambridge'}{' '}
                    · {new URL(url).pathname.split('/').at(-1)?.replace(/_\d+$/, '')}
                  </a>
                </p>
              ))}
              {settings.showSources && (
                <p className="small muted">
                  {pendingIpa
                    ? 'Hay transcripciones locales pendientes de contraste. Solo la IPA validada interviene en el filtro estricto.'
                    : 'Transcripciones contrastadas.'}
                </p>
              )}
              {settings.showSources && (
                <p className="small">
                  {!entries.find((entry) => entry.verb.id === v.id)?.locallyModified
                    ? 'Contenido con revisión asistida. Los cursos son orientativos.'
                    : 'Contenido del editor local.'}
                </p>
              )}
              {settings.showSources &&
                v.sources.map((source, i) => (
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
          )}
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
