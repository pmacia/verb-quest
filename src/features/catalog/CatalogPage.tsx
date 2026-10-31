import { toLocalDate } from '../../shared/time/calendar';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppProviders';
import { queryCatalog, formValues } from './query';
import { topicLabel } from './classification-labels';
import { saveList } from './list-service';
import { Icon } from '../../shared/ui/Icon';
import { Dialog } from '../../shared/ui/Dialog';
import { useCatalogAudio } from './use-catalog-audio';
import { CatalogArchiveDialog } from './CatalogArchiveDialog';
import { FamilyFilter } from './FamilyFilter';
import { filterFamilyCandidates, type RelationScope } from './family-filter';
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
  const [editing, setEditing] = useState(false);
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
            Tu biblioteca de verbos<span className="dot">.</span>
          </h1>
          <p>Todo empieza con una palabra. Encuentra tu próximo descubrimiento.</p>
        </div>
        <div className="catalog-edit-actions">
          <button
            ref={editToggle}
            className="secondary catalog-edit-toggle"
            role="switch"
            aria-label="Modo de edición del catálogo"
            aria-checked={editing}
            onClick={() => setEditing(!editing)}
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
            <div className="toolbar-actions">
              <button
                className={filters ? 'secondary active' : 'secondary'}
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
            {filters && (
              <div className="filters-grid">
                <label>
                  Curso
                  <select
                    aria-label="Curso"
                    onChange={(e) => filter('courses', e.target.value)}
                    value={q.filter.courses?.[0] ?? ''}
                  >
                    <option value="">Todos los cursos</option>
                    {[1, 2, 3, 4].map((n) => (
                      <option value={`eso${n}`} key={n}>
                        {n}.º ESO
                      </option>
                    ))}
                  </select>
                </label>
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
                <label>
                  Frecuencia
                  <select
                    value={q.filter.frequencies?.[0] ?? ''}
                    onChange={(e) => filter('frequencies', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {Object.entries(frequency).map(([v, l]) => (
                      <option value={v} key={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Aprendizaje
                  <select
                    value={q.filter.states?.[0] ?? ''}
                    onChange={(e) => filter('states', e.target.value)}
                  >
                    <option value="">Todos</option>
                    {[
                      ['new', 'Nuevo'],
                      ['learning', 'En aprendizaje'],
                      ['needs_review', 'Necesita refuerzo'],
                      ['consolidating', 'Consolidando'],
                      ['mastered', 'Dominado'],
                    ].map(([v, l]) => (
                      <option value={v} key={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tema
                  <select
                    onChange={(e) => filter('topics', e.target.value)}
                    value={q.filter.topics?.[0] ?? ''}
                  >
                    <option value="">Todos</option>
                    {[...new Set(verbs.flatMap((v) => v.classification.topics ?? []))]
                      .sort()
                      .map((v) => (
                        <option key={v} value={v}>
                          {topicLabel(v)}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Terminación escrita (pasado)
                  <input
                    placeholder="Ej.: ought"
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
                </label>
                <label>
                  Forma del filtro fonético
                  <select
                    value={q.filter.phonetic?.[0]?.form ?? 'base'}
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
                              form: q.filter.phonetic?.[0]?.form ?? 'base',
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
                  Sonido final (IPA validada)
                  <input
                    placeholder="Ej.: t o /t/"
                    value={q.filter.phonetic?.[0]?.ending ?? ''}
                    onChange={(e) =>
                      setQ({
                        ...q,
                        filter: {
                          ...q.filter,
                          phonetic: [
                            {
                              form: q.filter.phonetic?.[0]?.form ?? 'base',
                              dialect: q.filter.phonetic?.[0]?.dialect ?? 'uk',
                              ending: e.target.value,
                            },
                          ],
                        },
                      })
                    }
                  />
                </label>
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
                    Quitar {k}: {JSON.stringify(v).replace(/[\[\]"{}]/g, '')} ×
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
          <div className="panel verb-table">
            <div className="verb-table-head">
              <span />
              <span>BASE</span>
              <span>PASADO SIMPLE</span>
              <span>PARTICIPIO</span>
              <span>SIGNIFICADO</span>
              <span />
            </div>
            {result.items.map((v) => (
              <div className="verb-row" key={v.id}>
                <input
                  type="checkbox"
                  aria-label={`Seleccionar ${v.lemma}`}
                  checked={selected.includes(v.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? [...selected, v.id] : selected.filter((id) => id !== v.id),
                    )
                  }
                />
                <Link to={`/verbs/${v.id}`} className="verb-base">
                  {v.lemma}
                  <small>{frequency[v.classification.frequencyBand]}</small>
                </Link>
                <span>
                  <small className="mobile-label">Pasado</small>
                  {formValues(v, 'pastSimple').join(' / ')}
                </span>
                <span>
                  <small className="mobile-label">Participio</small>
                  {formValues(v, 'pastParticiple').join(' / ')}
                </span>
                <span className="meaning">{v.meanings.slice(0, 2).join(' / ')}</span>
                <div className="verb-row-actions">
                  <button
                    className="icon-button"
                    aria-pressed={audio.playingId === v.id}
                    aria-label={
                      audio.playingId === v.id
                        ? `Detener audio de ${v.lemma}`
                        : `Escuchar las tres formas de ${v.lemma}`
                    }
                    title="Escuchar las tres formas"
                    onClick={() => void audio.play(v)}
                  >
                    <Icon name="sound" size={20} />
                  </button>
                  {editing && (
                    <>
                      <Link
                        to={`/editor/verbs/${v.id}`}
                        className="icon-link"
                        aria-label={`Editar ${v.lemma}`}
                        title="Editar verbo"
                      >
                        <Icon name="edit" size={20} />
                      </Link>
                      {showArchived ? (
                        <button
                          className="icon-button"
                          aria-label={`Restaurar ${v.lemma}`}
                          title="Restaurar verbo"
                          disabled={restoring === v.id}
                          onClick={async () => {
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
                        >
                          <Icon name="restore" size={20} />
                        </button>
                      ) : (
                        <button
                          className="icon-button"
                          aria-label={`Quitar ${v.lemma} del catálogo`}
                          title="Archivar verbo"
                          onClick={() => setArchiving(v)}
                        >
                          <Icon name="trash" size={20} />
                        </button>
                      )}
                    </>
                  )}
                  <Link
                    to={`/verbs/${v.id}`}
                    className="icon-link"
                    aria-label={`Ver ficha de ${v.lemma}`}
                    title="Ver ficha"
                  >
                    <Icon name="arrow" size={18} />
                  </Link>
                </div>
              </div>
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
