import { relationLabels } from './VerbBadges';
import { stateLabels } from '../progress/selectors';
import { FilterChoices } from './FilterChoices';
import './catalog-design.css';
import { CatalogVerbItem } from './CatalogVerbItem';
import { toLocalDate } from '../../shared/time/calendar';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import { queryCatalog, formValues } from './query';
import { topicLabel } from './classification-labels';
import { saveList } from './list-service';
import { Icon } from '../../shared/ui/Icon';
import { Dialog } from '../../shared/ui/Dialog';
import { useCatalogAudio } from './use-catalog-audio';
import { CatalogArchiveDialog } from './CatalogArchiveDialog';
import { FamilyFilter } from './FamilyFilter';
import { filterFamilyCandidates, type RelationScope } from './family-filter';
import { IpaHelpButton } from '../phonetics/IpaHelpButton';
import { restoreVerb } from './editor-service';
import type { Verb, CatalogQuery } from '../../shared/domain/types';
const frequency: Record<string, string> = {
  essential: 'Esencial',
  common: 'Frecuente',
  less_common: 'Menos frecuente',
  advanced: 'Avanzado',
};
export function CatalogPage() {
  const { verbs, lists, progress, repos, profile, refresh, settings } = useApp();
  const [q, setQ] = useState<CatalogQuery>({
    text: '',
    filter: {},
    sort: 'alphabetical',
    direction: 'asc',
  });
  const [viewMode, setViewMode] = useState<'expanded' | 'compact'>(() => {
    try {
      return localStorage.getItem('verbquest.catalog-density') === 'compact'
        ? 'compact'
        : 'expanded';
    } catch {
      return 'expanded';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('verbquest.catalog-density', viewMode);
    } catch {
      /* Optional presentation preference. */
    }
  }, [viewMode]);
  const [editing, setEditing] = useState(false);
  const [editNoticeDismissed, setEditNoticeDismissed] = useState(false);
  const editToggle = useRef<HTMLButtonElement>(null);
  const focusAfterArchive = useRef(false);
  const [archiving, setArchiving] = useState<Verb | null>(null);
  useEffect(() => {
    if (!archiving && focusAfterArchive.current) {
      focusAfterArchive.current = false;
      editToggle.current?.focus();
    }
  }, [archiving]);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [familySelection, setFamilySelection] = useState<string[] | null>(null);
  const [filters, setFilters] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [newList, setNewList] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const familyCatalog = showArchived
    ? verbs.filter((v) => v.archivedAt).map((v) => ({ ...v, archivedAt: null }))
    : verbs.filter((v) => !v.archivedAt);
  const relation = (q.filter.relations?.[0] ?? '') as RelationScope;
  const result = queryCatalog(filterFamilyCandidates(familyCatalog, relation, familySelection), q, {
    lists,
    progress,
    strictIpa: settings.strictIpa === true,
    today: toLocalDate(new Date().toISOString(), settings.timeZone),
  });
  const audio = useCatalogAudio(result.items.map((v) => v.id));
  function filter(key: string, value: string) {
    setQ({ ...q, filter: { ...q.filter, [key]: value ? [value] : [] } });
  }
  const active = Object.entries(q.filter).filter(([, v]) => Array.isArray(v) && v.length);
  function clearFilters() {
    setQ({ ...q, filter: {} });
    setFamilySelection(null);
  }
  const filterCount = active.length + (familySelection !== null ? 1 : 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EXPLORA · DESCUBRE · APRENDE</span>
          <h1>
            Verbos irregulares<span className="dot">.</span>
            <span className="catalog-total" aria-label={`${result.total} verbos`}>
              {result.total}
            </span>
          </h1>
          <p>Compara sus formas, escucha y descubre cómo utilizarlos.</p>
        </div>
        <div className="catalog-edit-actions">
          <div className="catalog-density" role="group" aria-label="Vista del catálogo">
            <button
              type="button"
              className="secondary"
              aria-label="Vista detallada"
              aria-pressed={viewMode === 'expanded'}
              onClick={() => setViewMode('expanded')}
            >
              Detallada
            </button>
            <button
              type="button"
              className="secondary"
              aria-label="Vista compacta"
              aria-pressed={viewMode === 'compact'}
              onClick={() => setViewMode('compact')}
            >
              Compacta
            </button>
          </div>
          <button
            ref={editToggle}
            className="secondary catalog-edit-toggle"
            role="switch"
            aria-label="Modo de edición del catálogo"
            aria-checked={editing}
            onClick={() => {
              setEditing(!editing);
              setEditNoticeDismissed(false);
            }}
          >
            <span className="switch-track" aria-hidden="true">
              <span />
            </span>
            Editar catálogo
          </button>
          {editing && (
            <Link
              className="button secondary"
              to="/editor/verbs/new"
              aria-label="Crear verbo"
              title="Crear nueva tarjeta"
            >
              <Icon name="plus" />
            </Link>
          )}
        </div>
      </div>
      {editing && !editNoticeDismissed && (
        <div className="notice catalog-edit-notice">
          <p>
            Modo de edición: utiliza el lápiz para editar o la papelera para archivar. El archivado
            es reversible.
          </p>
          <button
            type="button"
            className="icon-button"
            aria-label="Cerrar aviso de modo edición"
            onClick={() => setEditNoticeDismissed(true)}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      <p className="catalog-audio-status" role="status">
        {audio.message}
      </p>
      {actionError && <p role="alert">{actionError}</p>}
      {archiving && (
        <CatalogArchiveDialog
          verb={archiving}
          onClose={() => setArchiving(null)}
          onArchived={() => {
            setSelected(selected.filter((id) => id !== archiving.id));
            focusAfterArchive.current = true;
            setArchiving(null);
          }}
        />
      )}
      <div className="catalog-layout">
        <section>
          <div className="panel catalog-toolbar">
            <div className="search-box">
              <Icon name="search" />
              <input
                aria-label="Buscar verbos"
                placeholder="Busca un verbo, una forma o un significado…"
                value={q.text}
                onChange={(e) => setQ({ ...q, text: e.target.value })}
              />
            </div>
            {q.text && (
              <button
                type="button"
                className="text-button"
                onClick={() => setQ({ ...q, text: '' })}
              >
                Limpiar búsqueda
              </button>
            )}
            <div className="toolbar-actions">
              <button
                className={filters ? 'secondary active' : 'secondary'}
                aria-expanded={filters}
                aria-controls="catalog-filters"
                onClick={() => setFilters(!filters)}
              >
                <Icon name="filter" />
                Filtros {filterCount > 0 && `(${filterCount})`}
              </button>
              <label className="sort-control">
                <span className="sr-only">Ordenar verbos</span>
                <select
                  aria-label="Ordenar verbos"
                  value={q.sort}
                  onChange={(e) => setQ({ ...q, sort: e.target.value as CatalogQuery['sort'] })}
                >
                  {[
                    ['alphabetical', 'A → Z'],
                    ['frequency', 'Frecuencia'],
                    ['course', 'Curso'],
                    ['mastery', 'Aprendizaje'],
                    ['difficulty', 'Dificultad'],
                    ['review', 'Prioridad de repaso'],
                  ].map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="catalog-quick-filters" role="group" aria-label="Cursos rápidos">
              <button
                type="button"
                className="chip"
                aria-pressed={!filterCount}
                onClick={clearFilters}
              >
                Todos
              </button>
              {[1, 2, 3, 4].map((n) => (
                <button
                  type="button"
                  className="chip"
                  key={n}
                  aria-pressed={q.filter.courses?.[0] === `eso${n}`}
                  onClick={() =>
                    filter('courses', q.filter.courses?.[0] === `eso${n}` ? '' : `eso${n}`)
                  }
                >
                  {n}.º ESO
                </button>
              ))}
            </div>
            {filters && (
              <div className="filters-grid" id="catalog-filters">
                <FilterChoices
                  label="Curso"
                  value={q.filter.courses?.[0] ?? ''}
                  onChange={(value) => filter('courses', value)}
                  options={[
                    ['', 'Todos los cursos'],
                    ...[1, 2, 3, 4].map((n) => [`eso${n}`, `${n}.º ESO`] as const),
                  ]}
                />
                <FamilyFilter
                  verbs={familyCatalog}
                  relation={relation}
                  selected={familySelection}
                  onRelation={(value) => {
                    filter('relations', value);
                    setFamilySelection(null);
                  }}
                  onSelection={setFamilySelection}
                />
                <FilterChoices
                  label="Frecuencia"
                  value={q.filter.frequencies?.[0] ?? ''}
                  onChange={(value) => filter('frequencies', value)}
                  options={[['', 'Todas'], ...Object.entries(frequency)]}
                />
                <FilterChoices
                  label="Aprendizaje"
                  value={q.filter.states?.[0] ?? ''}
                  onChange={(value) => filter('states', value)}
                  options={[
                    ['', 'Todos'],
                    ['new', 'Nuevo'],
                    ['learning', 'En aprendizaje'],
                    ['needs_review', 'Necesita refuerzo'],
                    ['consolidating', 'Consolidando'],
                    ['mastered', 'Dominado'],
                  ]}
                />
                <FilterChoices
                  label="Tema"
                  value={q.filter.topics?.[0] ?? ''}
                  onChange={(value) => filter('topics', value)}
                  options={[
                    ['', 'Todos los temas'],
                    ...[...new Set(verbs.flatMap((v) => v.classification.topics ?? []))]
                      .sort()
                      .map((topic) => [topic, topicLabel(topic)] as const),
                  ]}
                />
                <label>
                  Terminación escrita (pasado)
                  <input
                    placeholder="Ej.: ought"
                    list="spelling-ending-examples"
                    aria-label="Terminación escrita (pasado)"
                    aria-describedby="spelling-ending-help"
                    value={q.filter.spelling?.[0]?.ending ?? ''}
                    onChange={(e) =>
                      setQ({
                        ...q,
                        filter: {
                          ...q.filter,
                          spelling: e.target.value
                            ? [{ form: 'pastSimple', ending: e.target.value }]
                            : [],
                        },
                      })
                    }
                  />
                  <datalist id="spelling-ending-examples">
                    <option value="ought">bought · thought · brought</option>
                    <option value="ew">grew · knew · threw</option>
                    <option value="ent">went · sent · spent</option>
                  </datalist>
                  <small id="spelling-ending-help" className="muted">
                    Elige un ejemplo o escribe otra terminación.
                  </small>
                </label>
                <label>
                  Forma del filtro fonético
                  <select
                    value={q.filter.phonetic?.[0]?.form ?? 'pastParticiple'}
                    onChange={(e) =>
                      setQ({
                        ...q,
                        filter: {
                          ...q.filter,
                          phonetic: [
                            {
                              form: e.target.value as 'base' | 'pastSimple' | 'pastParticiple',
                              dialect: q.filter.phonetic?.[0]?.dialect ?? 'uk',
                              ending: q.filter.phonetic?.[0]?.ending ?? '',
                            },
                          ],
                        },
                      })
                    }
                  >
                    <option value="base">Forma base</option>
                    <option value="pastSimple">Pasado simple</option>
                    <option value="pastParticiple">Participio pasado</option>
                  </select>
                </label>
                <label>
                  Dialecto del filtro fonético
                  <select
                    value={q.filter.phonetic?.[0]?.dialect ?? 'uk'}
                    onChange={(e) =>
                      setQ({
                        ...q,
                        filter: {
                          ...q.filter,
                          phonetic: [
                            {
                              form: q.filter.phonetic?.[0]?.form ?? 'pastParticiple',
                              dialect: e.target.value as 'uk' | 'us',
                              ending: q.filter.phonetic?.[0]?.ending ?? '',
                            },
                          ],
                        },
                      })
                    }
                  >
                    <option value="uk">Británico (UK)</option>
                    <option value="us">Estadounidense (US)</option>
                  </select>
                </label>
                <label>
                  {settings.strictIpa ? 'Sonido final (IPA validada)' : 'Sonido final'}
                  <input
                    placeholder="Ej.: t o /t/"
                    list="phonetic-ending-examples"
                    aria-label={settings.strictIpa ? 'Sonido final (IPA validada)' : 'Sonido final'}
                    aria-describedby="phonetic-ending-help"
                    value={q.filter.phonetic?.[0]?.ending ?? ''}
                    onChange={(e) =>
                      setQ({
                        ...q,
                        filter: {
                          ...q.filter,
                          phonetic: [
                            {
                              form: q.filter.phonetic?.[0]?.form ?? 'pastParticiple',
                              dialect: q.filter.phonetic?.[0]?.dialect ?? 'uk',
                              ending: e.target.value,
                            },
                          ],
                        },
                      })
                    }
                  />
                  <datalist id="phonetic-ending-examples">
                    <option value="/t/">bought</option>
                    <option value="/d/">read</option>
                    <option value="/n/">gone</option>
                  </datalist>
                  <small id="phonetic-ending-help" className="muted">
                    {settings.strictIpa
                      ? 'Solo IPA validada para la forma y el dialecto elegidos.'
                      : 'Elige un ejemplo o escribe otro sonido. Las agrupaciones son orientativas y dependen de la forma y el dialecto.'}
                  </small>
                </label>
                <IpaHelpButton />
              </div>
            )}
            {filterCount > 0 && (
              <div className="chips">
                {familySelection !== null && (
                  <button
                    className="chip"
                    aria-label="Quitar filtro de familias"
                    onClick={() => setFamilySelection(null)}
                  >
                    Familias: selección personalizada ×
                  </button>
                )}
                <button className="chip" onClick={clearFilters}>
                  Limpiar filtros
                </button>
                {active.map(([k, v]) => (
                  <button
                    key={k}
                    className="chip"
                    onClick={() => {
                      setQ({ ...q, filter: { ...q.filter, [k]: [] } });
                      if (k === 'relations') setFamilySelection(null);
                    }}
                  >
                    Quitar{' '}
                    {{
                      courses: 'curso',
                      frequencies: 'frecuencia',
                      states: 'aprendizaje',
                      topics: 'tema',
                      spelling: 'terminación escrita',
                      phonetic: 'sonido final',
                      listIds: 'lista',
                      relations: 'relación',
                    }[k] ?? k}
                    :{' '}
                    {v
                      .map((value: unknown) =>
                        typeof value === 'string'
                          ? k === 'topics'
                            ? topicLabel(value)
                            : k === 'listIds'
                              ? (lists.find((l) => l.id === value)?.name ?? value)
                              : k === 'courses'
                                ? `${value.replace('eso', '')}.º ESO`
                                : (frequency[value] ??
                                  relationLabels[value] ??
                                  stateLabels[value as keyof typeof stateLabels] ??
                                  value)
                          : (value as { ending?: string }).ending,
                      )
                      .join(', ')}{' '}
                    ×
                  </button>
                ))}
              </div>
            )}
          </div>
          <label className="small" style={{ marginTop: 16 }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Ver archivados
          </label>
          <div className="results-heading">
            <strong>
              {result.total} verbos <span>por descubrir</span>
            </strong>
            <span>
              {selected.length > 0
                ? `${selected.length} seleccionados`
                : 'Selecciona para crear una lista'}
            </span>
          </div>
          {selected.length > 0 && (
            <div
              className="catalog-selection-banner"
              role="region"
              aria-label="Selección de verbos"
            >
              <strong>{selected.length} seleccionados</strong>
              <button type="button" className="secondary" onClick={() => setNewList(true)}>
                Guardar en lista
              </button>
              <button type="button" className="text-button" onClick={() => setSelected([])}>
                Deseleccionar todos
              </button>
            </div>
          )}
          <div className={`catalog-items catalog-view-${viewMode}`}>
            {result.items.map((v) => (
              <CatalogVerbItem
                key={v.id}
                verb={v}
                compact={viewMode === 'compact'}
                selected={selected.includes(v.id)}
                onSelect={(checked) =>
                  setSelected(checked ? [...selected, v.id] : selected.filter((id) => id !== v.id))
                }
                editing={editing}
                archived={showArchived}
                restoring={restoring === v.id}
                onArchive={() => setArchiving(v)}
                onRestore={async () => {
                  setRestoring(v.id);
                  setActionError('');
                  try {
                    await restoreVerb(repos, v.id);
                    await refresh();
                    editToggle.current?.focus();
                  } catch {
                    setActionError('No se pudo restaurar el verbo. Inténtalo de nuevo.');
                  } finally {
                    setRestoring(null);
                  }
                }}
                playingKey={audio.playingKey}
                playing={audio.playingKey === v.id}
                onPlayAll={() => void audio.play(v)}
                onPlayForm={(form, value, dialect) => void audio.play(v, form, value, dialect)}
              />
            ))}
            {!result.total && (
              <div className="empty">
                <h2>No hay coincidencias</h2>
                <p>Prueba otra búsqueda o elimina algún filtro.</p>
                <button
                  onClick={() => {
                    clearFilters();
                    setQ({ ...q, text: '', filter: {} });
                  }}
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </div>
          <div className="row result-bottom">
            <p>Las recomendaciones de curso son orientativas y editables.</p>
            <button disabled={!selected.length} onClick={() => setNewList(true)}>
              <Icon name="plus" />
              Guardar selección
            </button>
          </div>
        </section>
        <aside className="catalog-aside">
          <div className="panel">
            <div className="section-title">
              <Icon name="book" />
              <h2>Mis listas</h2>
            </div>
            <button
              className={!q.filter.listIds?.length ? 'list-item active' : 'list-item'}
              onClick={() => filter('listIds', '')}
            >
              Todos los verbos <span>{verbs.filter((v) => !v.archivedAt).length}</span>
            </button>
            {lists.map((l) => (
              <button key={l.id} className="list-item" onClick={() => filter('listIds', l.id)}>
                {l.name}
                <span>{l.verbIds.length}</span>
              </button>
            ))}
            {!lists.length && (
              <p className="muted small">
                Selecciona verbos y guárdalos juntos para tu próximo examen.
              </p>
            )}
            <button className="text-button" onClick={() => setNewList(true)}>
              <Icon name="plus" size={18} />
              Crear una lista
            </button>
          </div>
          <div className="tip-card">
            <span className="tip-icon">✦</span>
            <h3>Busca más allá del infinitivo</h3>
            <p>
              Prueba a escribir <strong>went</strong> o <strong>bought</strong>. Encontrarás también
              sus formas base.
            </p>
          </div>
          <Link to="/editor/import-export" className="import-link">
            <Icon name="upload" />
            Importar o exportar datos
            <Icon name="arrow" size={16} />
          </Link>
        </aside>
      </div>
      {newList && (
        <Dialog title="Guardar lista" onClose={() => setNewList(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await saveList(repos, profile.id, { name, verbIds: selected });
                await refresh();
                setNewList(false);
                setName('');
                setSelected([]);
              } catch (e) {
                setError(String(e));
              }
            }}
          >
            <label>
              Nombre de la lista
              <input
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Examen de inglés"
              />
            </label>
            <p>{selected.length} verbos seleccionados. Puedes añadir más desde sus fichas.</p>
            {error && <p role="alert">{error}</p>}
            <button>Guardar lista</button>
          </form>
        </Dialog>
      )}
    </>
  );
}
