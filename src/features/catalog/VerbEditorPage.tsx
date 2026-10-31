import { validate } from '../../shared/domain/validation';
import { StatusPanel } from '../../shared/ui/StatusPanel';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useBlocker, Link } from 'react-router-dom';
import { useApp } from '../../app/AppProviders';
import {
  saveVerb,
  archiveVerb,
  restoreVerb,
  getArchiveImpact,
  resolveSeedConflict,
} from './editor-service';
import { Dialog } from '../../shared/ui/Dialog';
import { systemClock } from '../../shared/time/clock';
import type { Verb } from '../../shared/domain/types';
const emptyVerb = (): Verb => ({
  id: '',
  lemma: '',
  forms: {
    base: { value: '' },
    pastSimple: { variants: [{ value: '', dialect: 'all' }] },
    pastParticiple: { variants: [{ value: '', dialect: 'all' }] },
  },
  meanings: [],
  classification: {
    formRelation: 'all_different',
    frequencyBand: 'common',
    patternGroups: [],
    recommendedCourses: ['eso1'],
    topics: [],
    difficulty: 'introductory',
  },
  examples: [],
  sources: [],
  editorialStatus: 'draft',
  archivedAt: null,
  contentVersion: 'new',
});
export function VerbEditorPage() {
  const { id } = useParams();
  const { entries, repos, refresh } = useApp();
  const current = entries.find((e) => e.verb.id === id);
  const [verb, setVerb] = useState<Verb>(() => structuredClone(current?.verb ?? emptyVerb()));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [archive, setArchive] = useState<{ lists: number; plans: number; sessions: number } | null>(
    null,
  );
  const [json, setJson] = useState('');
  const navigate = useNavigate();
  const blocker = useBlocker(dirty && !saved);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirty && !saved) e.preventDefault();
    };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [dirty, saved]);
  useEffect(() => {
    if (saved) navigate(`/verbs/${verb.id}`);
  }, [saved]);
  function change(value: Verb) {
    setVerb(value);
    setDirty(true);
    setError('');
  }
  if (id && !current) return <StatusPanel title="Verbo no encontrado" />;
  return (
    <>
      <Link className="back-link" to="/verbs">
        ← Biblioteca
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MODO EDICIÓN · CONTENIDO LOCAL</span>
          <h1>{id ? 'Editar verbo' : 'Un nuevo descubrimiento'}</h1>
          <p>Los cambios afectan al catálogo de este navegador. No es un sistema de permisos.</p>
        </div>
        <Link className="button secondary" to="/editor/import-export">
          Importar / exportar
        </Link>
      </div>
      <section className="panel">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              const r = await saveVerb(repos, verb, current?.verb.contentVersion ?? null);
              if (r.status === 'saved') {
                await refresh();
                setDirty(false);
                setSaved(true);
              } else
                setError(
                  r.status === 'invalid'
                    ? r.issues.map((i) => `${i.path}: ${i.message}`).join(' · ')
                    : r.status === 'duplicate'
                      ? 'Ya existe un verbo con ese infinitivo. Revisa la ficha existente o cambia el identificador y el lema.'
                      : 'La ficha ha cambiado en otra pestaña. Recarga antes de guardar.',
                );
            } catch (e) {
              setError(String(e));
            }
          }}
        >
          <div className="form-grid">
            <label>
              Identificador estable
              <input
                required
                pattern="[a-z0-9][a-z0-9-]*"
                disabled={!!id}
                value={verb.id}
                onChange={(e) => change({ ...verb, id: e.target.value })}
              />
            </label>
            <label>
              Forma base
              <input
                required
                value={verb.lemma}
                onChange={(e) =>
                  change({
                    ...verb,
                    lemma: e.target.value,
                    forms: { ...verb.forms, base: { ...verb.forms.base, value: e.target.value } },
                  })
                }
              />
            </label>
            {(['pastSimple', 'pastParticiple'] as const).map((f, i) => (
              <label key={f}>
                {i ? 'Participio pasado' : 'Pasado simple'} (variantes separadas por /)
                <input
                  required
                  value={verb.forms[f].variants.map((a) => a.value).join(' / ')}
                  onChange={(e) =>
                    change({
                      ...verb,
                      forms: {
                        ...verb.forms,
                        [f]: {
                          ...verb.forms[f],
                          variants: e.target.value.split('/').map((x, i) => ({
                            ...verb.forms[f].variants[i],
                            value: x.trim(),
                            dialect: verb.forms[f].variants[i]?.dialect ?? 'all',
                          })),
                        },
                      },
                    })
                  }
                />
              </label>
            ))}
            <label className="full">
              Significados (separados por ;)
              <input
                required
                value={verb.meanings.join('; ')}
                onChange={(e) =>
                  change({
                    ...verb,
                    meanings: e.target.value
                      .split(';')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <label>
              Relación de formas
              <select
                value={verb.classification.formRelation}
                onChange={(e) =>
                  change({
                    ...verb,
                    classification: {
                      ...verb.classification,
                      formRelation: e.target.value as Verb['classification']['formRelation'],
                    },
                  })
                }
              >
                {[
                  ['all_same', 'Tres iguales'],
                  ['past_participle_same', 'Pasado y participio iguales'],
                  ['all_different', 'Tres diferentes'],
                  ['special', 'Especiales'],
                ].map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Frecuencia
              <select
                value={verb.classification.frequencyBand}
                onChange={(e) =>
                  change({
                    ...verb,
                    classification: {
                      ...verb.classification,
                      frequencyBand: e.target.value as Verb['classification']['frequencyBand'],
                    },
                  })
                }
              >
                {[
                  ['essential', 'Esencial'],
                  ['common', 'Frecuente'],
                  ['less_common', 'Menos frecuente'],
                  ['advanced', 'Avanzado'],
                ].map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cursos recomendados (1, 2, 3, 4)
              <input
                value={verb.classification.recommendedCourses
                  .map((x) => x.replace('eso', ''))
                  .join(', ')}
                onChange={(e) =>
                  change({
                    ...verb,
                    classification: {
                      ...verb.classification,
                      recommendedCourses: e.target.value
                        .split(',')
                        .map((x) => 'eso' + x.trim())
                        .filter((x) => /^eso[1-4]$/.test(x)),
                    },
                  })
                }
              />
            </label>
            <label>
              Estado de revisión
              <select
                value={verb.editorialStatus}
                onChange={(e) =>
                  change({ ...verb, editorialStatus: e.target.value as Verb['editorialStatus'] })
                }
              >
                <option value="draft">Borrador</option>
                <option value="needs_review">Pendiente de revisión</option>
                <option value="validated">Revisado</option>
              </select>
            </label>
            <label className="full">
              Notas de uso
              <textarea
                value={verb.notes?.join('\n') ?? ''}
                onChange={(e) => change({ ...verb, notes: e.target.value.split('\n') })}
              />
            </label>
          </div>
          <details>
            <summary>Todos los campos: ejemplos, audio, fuentes y etiquetas</summary>
            <p className="small">
              Editor avanzado JSON. Al aplicar se conservan todos los campos; el guardado validará
              su estructura. No se ejecuta su contenido.
            </p>
            <button
              type="button"
              className="secondary"
              onClick={() => setJson(JSON.stringify(verb, null, 2))}
            >
              Cargar datos actuales
            </button>
            <label>
              Datos completos de la ficha
              <textarea
                className="code-editor"
                value={json}
                onChange={(e) => setJson(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                try {
                  const checked = validate<Verb>('verb', JSON.parse(json));
                  if (!checked.ok)
                    throw Error(checked.issues.map((i) => i.path + ': ' + i.message).join(' · '));
                  const next = checked.value;
                  if (id && next.id !== id) throw Error('El identificador no se puede cambiar');
                  change(next);
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              Aplicar JSON al formulario
            </button>
          </details>
          {error && <p role="alert">{error}</p>}
          <div className="actions">
            <button>Guardar verbo</button>
            <Link to="/verbs" className="button secondary">
              Cancelar
            </Link>
            {current && !current.verb.archivedAt && (
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  const i = await getArchiveImpact(repos, verb.id);
                  setArchive({
                    lists: i.listIds.length,
                    plans: i.planIds.length,
                    sessions: i.sessionIds.length,
                  });
                }}
              >
                Archivar verbo
              </button>
            )}
            {current?.verb.archivedAt && (
              <button
                type="button"
                className="secondary"
                onClick={async () => {
                  await restoreVerb(repos, verb.id);
                  await refresh();
                  setDirty(false);
                  setSaved(true);
                }}
              >
                Restaurar verbo
              </button>
            )}
          </div>
        </form>
      </section>
      {current?.pendingBase && (
        <section className="panel">
          <h2>Hay una actualización del contenido base</h2>
          <p>Tu edición local se ha conservado. Elige qué versión usar.</p>
          {(['keep_local', 'accept_base'] as const).map((c) => (
            <button
              key={c}
              className="secondary"
              onClick={async () => {
                await resolveSeedConflict(repos, verb.id, c);
                await refresh();
                window.location.reload();
              }}
            >
              {c === 'keep_local' ? 'Conservar mi edición' : 'Usar versión base'}
            </button>
          ))}
        </section>
      )}
      {archive && (
        <Dialog title="Archivar este verbo" onClose={() => setArchive(null)}>
          <p>
            Afecta a {archive.lists} listas, hasta {archive.plans} planes y {archive.sessions}{' '}
            sesiones. Se omitirán preguntas pendientes; el historial se conserva. Puedes restaurarlo
            después.
          </p>
          <button
            className="danger"
            onClick={async () => {
              try {
                await archiveVerb(repos, verb.id, systemClock);
                await refresh();
                setArchive(null);
                setDirty(false);
                setSaved(true);
              } catch (e) {
                setError(String(e));
                setArchive(null);
              }
            }}
          >
            Confirmar archivo
          </button>
        </Dialog>
      )}
      {blocker.state === 'blocked' && (
        <Dialog title="Cambios sin guardar" onClose={() => blocker.reset()}>
          <p>Si sales, se perderán los cambios de este formulario.</p>
          <div className="actions">
            <button onClick={() => blocker.proceed()}>Salir sin guardar</button>
            <button className="secondary" onClick={() => blocker.reset()}>
              Seguir editando
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
