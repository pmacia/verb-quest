import { relationLabels } from './VerbBadges';
import { stateLabels } from '../progress/selectors';
import './catalog-design.css';
import { toLocalDate } from '../../shared/time/calendar';
import { useEffect, useRef, useState, useId } from 'react';
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
import type { Verb, CatalogQuery, FormKey, Dialect } from '../../shared/domain/types';
const frequency: Record<string, string> = {
  essential: 'Esencial',
  common: 'Frecuente',
  less_common: 'Menos frecuente',
  advanced: 'Avanzado',
};
const catalogueVerbIcons: Record<string, string> = {
  be: '👤',
  go: '🚀',
  have: '🗝️',
  do: '✅',
  get: '🎁',
  make: '🛠️',
  take: '🤲',
  come: '🚪',
  see: '👁️',
  know: '🧠',
  think: '💭',
  say: '💬',
  tell: '🗣️',
  give: '🤲',
  find: '🔍',
  feel: '❤️',
  leave: '🚶',
  put: '📥',
  bring: '📦',
  buy: '🛍️',
  eat: '🍎',
  drink: '🥤',
  sleep: '😴',
  read: '📖',
  write: '✍️',
  speak: '🗣️',
  hear: '👂',
  meet: '👥',
  run: '🏃',
  sit: '🪑',
  stand: '🧍',
  understand: '💡',
  teach: '👨‍🏫',
  learn: '📚',
  wear: '👕',
  lose: '❓',
  pay: '💳',
  send: '✉️',
  build: '🧱',
  keep: '🔐',
  begin: '🏁',
  break: '💥',
  choose: '👉',
  drive: '🚗',
  fly: '✈️',
  forget: '🤔',
  grow: '🌱',
  hold: '🤲',
  catch: '🧤',
  cut: '✂️',
  draw: '🎨',
  fall: '🍂',
  win: '🏆',
  sell: '🏷️',
  spend: '💰',
  swim: '🏊‍♂️',
  ride: '🚲',
  sing: '🎵',
  ring: '🔔',
  wake: '⏰',
  feed: '🥣',
  fight: '🥊',
  lend: '🤝',
  show: '📽️',
  shut: '🚪',
  hurt: '🩹',
  hit: '🎯',
  let: '🔓',
  mean: '💡',
  cost: '🏷️',
  become: '🌱',
  bend: '📐',
  bite: '🦷',
  blow: '💨',
  burn: '🔥',
  deal: '🤝',
  dig: '⛏️',
  dream: '💭',
  forgive: '🤝',
  freeze: '❄️',
  hide: '🙈',
  lay: '🛏️',
  lead: '🧭',
  lie: '🛋️',
  light: '🕯️',
  rise: '🌅',
  shake: '🤝',
  shine: '✨',
  shoot: '🏹',
  sink: '⚓',
  smell: '👃',
  spell: '🔤',
  spill: '🫗',
  stick: '🩹',
  steal: '🦹',
  sweep: '🧹',
  tear: '📄',
  throw: '⚾',
  beat: '🥁',
  hang: '🪝',
  arise: '🌅',
  awake: '⏰',
  bear: '💪',
  bind: '🪢',
  bleed: '🩸',
  breed: '🐣',
  burst: '🎈',
  creep: '🐛',
  forbid: '🚫',
  kneel: '🧎',
  lean: '🧗',
  seek: '📘',
  set: '⚙️',
  shrink: '📘',
  slide: '🛝',
  split: '🪓',
  spread: '🧈',
  spring: '🌱',
  swear: '✋',
  swing: '🏌️',
};
function CatalogGlyph({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    expanded: 'M4 3h16v7H4Zm0 11h16v7H4Z',
    compact: 'M4 5h16M4 12h16M4 19h16',
    chevron: 'm6 9 6 6 6-6',
    sort: 'M8 4v16m-4-4 4 4 4-4M16 20V4m-4 4 4-4 4 4',
    archive: 'M3 4h18v5H3Zm2 5v12h14V9M9 13h6',
    pattern: 'M4 4h4v4H4Zm12 0h4v4h-4ZM10 16h4v4h-4ZM6 8v4h12V8M12 12v4',
    tag: 'M3 3h8l10 10-8 8L3 11Zm4 4h.01',
  };
  return paths[name] ? (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  ) : (
    <Icon name={name} size={size} />
  );
}

function CatalogChoices({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  const name = useId();
  const icons: Record<string, string> = {
    Curso: 'study',
    Frecuencia: 'bolt',
    Aprendizaje: 'chart',
    Tema: 'tag',
  };
  return (
    <fieldset className="filter-choices">
      <legend>
        <CatalogGlyph name={icons[label] ?? 'filter'} size={13} />
        {label}
      </legend>
      <div className="filter-choice-options">
        {options.map(([id, text]) => (
          <label key={id} className="filter-choice" title={text}>
            <input
              type="radio"
              name={name}
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
            />
            <CatalogGlyph name={id ? (icons[label] ?? 'tag') : 'check'} size={12} />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CatalogEntry({
  verb,
  compact,
  selected,
  onSelect,
  editing,
  archived,
  restoring,
  onArchive,
  onRestore,
  playing,
  playingKey,
  onPlayAll,
  onPlayForm,
  dialect,
}: {
  verb: Verb;
  compact: boolean;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  editing: boolean;
  archived: boolean;
  restoring: boolean;
  onArchive: () => void;
  onRestore: () => void;
  playing: boolean;
  playingKey: string | null;
  onPlayAll: () => void;
  onPlayForm: (form: FormKey, value?: string, dialect?: Dialect) => void;
  dialect: Dialect;
}) {
  const forms = ['base', 'pastSimple', 'pastParticiple'] as const;
  const labels = {
    base: 'Infinitivo',
    pastSimple: 'Pasado simple',
    pastParticiple: 'Participio pasado',
  };
  const pattern = {
    all_same: 'AAA',
    past_participle_same: 'ABB',
    all_different: 'ABC',
    special: 'Especial',
  }[verb.classification.formRelation];
  const course = verb.classification.recommendedCourses[0];
  const topicIcons: Record<string, string> = {
    school: '📚',
    daily_life: '🏠',
    movement: '🚶',
    physical_action: '⚡',
    communication: '💬',
    cognition_mind: '💭',
    nature: '🌿',
    body_perception: '👁️',
    state_process: '🔄',
    finance_money: '💰',
  };
  const icon =
    catalogueVerbIcons[verb.lemma] ?? topicIcons[verb.classification.topics?.[0] ?? ''] ?? '📘';
  const renderSound = (form: FormKey, value: string, accent: Dialect) => {
    const active = playingKey === JSON.stringify([verb.id, form, value, accent]);
    return (
      <button
        type="button"
        className="cq-sound"
        aria-pressed={active}
        title={`${active ? 'Detener' : 'Escuchar'} ${value} · ${accent.toUpperCase()}`}
        aria-label={`${active ? 'Detener' : 'Escuchar'} ${form} de ${verb.lemma}: ${value} en ${accent.toUpperCase()}`}
        onClick={() => onPlayForm(form, value, accent)}
      >
        <span className="cq-accent">{accent.toUpperCase()}</span>
        <CatalogGlyph name="sound" size={14} />
      </button>
    );
  };
  return (
    <article
      className={`cq-card verb-row ${compact ? 'catalog-item-compact' : 'catalog-item-expanded'}${selected ? ' is-selected' : ''}`}
    >
      <header className="cq-card-heading">
        <label className="cq-select">
          <input
            type="checkbox"
            aria-label={`Seleccionar ${verb.lemma}`}
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
          />
        </label>
        <span className="cq-verb-icon" aria-hidden="true">
          {icon}
        </span>
        <div className="cq-card-copy">
          <div className="cq-title">
            <Link to={`/verbs/${verb.id}`} className="verb-base">
              {verb.lemma}
              <span className="sr-only"> · Ver ficha</span>
            </Link>
            <span className="cq-meaning" title={verb.meanings.join(' / ')}>
              {verb.meanings.join(' / ')}
            </span>
          </div>
          {!compact && (
            <div className="cq-badges" aria-label={`Características de ${verb.lemma}`}>
              {course && (
                <span
                  className="cq-label-badge cq-course"
                  title={`Desde ${course.replace('eso', '')}.º ESO`}
                >
                  <CatalogGlyph name="study" size={13} />
                  <span>
                    {course.replace('eso', '')}.º <span className="cq-mobile-optional">ESO</span>
                  </span>
                </span>
              )}
              <span
                className="cq-label-badge cq-pattern"
                title={relationLabels[verb.classification.formRelation]}
              >
                <CatalogGlyph name="pattern" size={13} />
                <span>{pattern}</span>
              </span>
              <span
                className="cq-label-badge cq-frequency"
                title={frequency[verb.classification.frequencyBand]}
              >
                <CatalogGlyph
                  name={verb.classification.frequencyBand === 'essential' ? 'bolt' : 'star'}
                  size={13}
                />
                <span className="cq-mobile-optional">
                  {frequency[verb.classification.frequencyBand]}
                </span>
                <span className="cq-mobile-only sr-only">
                  {frequency[verb.classification.frequencyBand]}
                </span>
              </span>
            </div>
          )}
        </div>
      </header>
      {compact ? (
        <div className="cq-forms-strip" aria-label="Formas y pronunciación">
          {forms.map((form) => (
            <div className="cq-inline-form" key={form}>
              <span className="cq-form-abbr" title={labels[form]}>
                {form === 'base' ? 'Inf.' : form === 'pastSimple' ? 'P.' : 'PP.'}
              </span>
              {(form === 'base' ? [verb.forms.base] : verb.forms[form].variants).map(
                (variant, index) => (
                  <span className="cq-inline-variant" key={`${variant.value}-${index}`}>
                    <strong
                      lang="en"
                      title={
                        'usageNote' in variant && typeof variant.usageNote === 'string'
                          ? variant.usageNote
                          : undefined
                      }
                    >
                      {variant.value}
                    </strong>
                    {variant.pronunciation?.[dialect]?.ipa && (
                      <span className="cq-ipa">{variant.pronunciation[dialect]?.ipa}</span>
                    )}
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="cq-forms-grid">
          {forms.map((form) => (
            <section className={`cq-form cq-${form}`} key={form} aria-label={labels[form]}>
              <h2>{labels[form]}</h2>
              {(form === 'base' ? [verb.forms.base] : verb.forms[form].variants).map(
                (variant, index) => (
                  <div className="cq-variant" key={`${variant.value}-${index}`}>
                    <h3 lang="en">{variant.value}</h3>
                    {'usageNote' in variant &&
                      typeof variant.usageNote === 'string' &&
                      variant.usageNote && <p className="cq-usage-note">{variant.usageNote}</p>}
                    <div className="cq-pronunciations">
                      {([dialect, dialect === 'uk' ? 'us' : 'uk'] as Dialect[]).map((accent) => (
                        <div className="cq-pronunciation" key={accent}>
                          <span className="cq-ipa">
                            {variant.pronunciation?.[accent]?.ipa ?? '—'}
                          </span>
                          {renderSound(form, variant.value, accent)}
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </section>
          ))}
        </div>
      )}
      <footer className="cq-card-footer">
        {!compact && (
          <span className="cq-tip" title={verb.mnemonics?.[0] ?? verb.examples[0]?.sentence}>
            <CatalogGlyph name="star" size={13} />
            <span>
              {verb.mnemonics?.[0] ?? verb.examples[0]?.sentence ?? 'Practica con una frase.'}
            </span>
          </span>
        )}
        <div className="cq-actions">
          {editing && (
            <>
              <Link
                className="cq-action"
                to={`/editor/verbs/${verb.id}`}
                aria-label={`Editar ${verb.lemma}`}
                title={`Editar ${verb.lemma}`}
              >
                <CatalogGlyph name="edit" />
              </Link>
              {archived ? (
                <button
                  type="button"
                  className="cq-action"
                  disabled={restoring}
                  aria-label={`Restaurar ${verb.lemma}`}
                  title="Restaurar verbo"
                  onClick={onRestore}
                >
                  <CatalogGlyph name="restore" />
                </button>
              ) : (
                <button
                  type="button"
                  className="cq-action cq-delete"
                  aria-label={`Quitar ${verb.lemma} del catálogo`}
                  title="Archivar verbo"
                  onClick={onArchive}
                >
                  <CatalogGlyph name="trash" />
                </button>
              )}
            </>
          )}
          <button
            type="button"
            className="cq-action"
            aria-pressed={playing}
            aria-label={
              playing
                ? `Detener audio de ${verb.lemma}`
                : `Escuchar las tres formas de ${verb.lemma}`
            }
            title={playing ? 'Detener audio' : 'Escuchar las tres formas'}
            onClick={onPlayAll}
          >
            <CatalogGlyph name="sound" />
          </button>
          <Link
            className="cq-action cq-open"
            to={`/verbs/${verb.id}`}
            aria-label={`Ver ficha de ${verb.lemma}`}
            title="Ver ficha"
          >
            <CatalogGlyph name="arrow" />
          </Link>
        </div>
      </footer>
    </article>
  );
}

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
      return localStorage.getItem('verbquest.catalog-density-v2') === 'expanded'
        ? 'expanded'
        : 'compact';
    } catch {
      return 'compact';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('verbquest.catalog-density-v2', viewMode);
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
    <div className="catalog-page">
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
              <CatalogGlyph name="expanded" />
              <span className="cq-control-label">Detallada</span>
            </button>
            <button
              type="button"
              className="secondary"
              aria-label="Vista compacta"
              aria-pressed={viewMode === 'compact'}
              onClick={() => setViewMode('compact')}
            >
              <CatalogGlyph name="compact" />
              <span className="cq-control-label">Compacta</span>
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
            <CatalogGlyph name="edit" />
            <span className="switch-track" aria-hidden="true">
              <span />
            </span>
            <span className="cq-control-label">Edición</span>
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
            <div className="search-box catalog-search">
              <CatalogGlyph name="search" size={18} />
              <input
                type="search"
                aria-label="Buscar verbos"
                placeholder="Infinitivo, pasado o español…"
                value={q.text}
                onChange={(e) => setQ({ ...q, text: e.target.value })}
              />
              {q.text && (
                <button
                  type="button"
                  className="cq-action"
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                  onClick={() => setQ({ ...q, text: '' })}
                >
                  <CatalogGlyph name="close" />
                </button>
              )}
            </div>
            <div className="toolbar-actions cq-tools">
              <button
                type="button"
                className="cq-filter-toggle"
                aria-label="Filtros"
                title={filters ? 'Contraer filtros' : 'Desplegar filtros'}
                aria-expanded={filters}
                aria-controls="catalog-filters"
                onClick={() => setFilters(!filters)}
              >
                <CatalogGlyph name="filter" />
                <span className="cq-control-label">Filtros</span>
                {filterCount > 0 && <span className="cq-count">{filterCount}</span>}
                <span className={`cq-chevron${filters ? ' is-open' : ''}`}>
                  <CatalogGlyph name="chevron" size={13} />
                </span>
              </button>
              <label className="sort-control cq-sort">
                <CatalogGlyph name="sort" />
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
              <label
                className={`cq-archive${showArchived ? ' is-active' : ''}`}
                title="Ver archivados"
              >
                <input
                  type="checkbox"
                  aria-label="Ver archivados"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                <CatalogGlyph name="archive" />
                <span className="cq-control-label">Archivados</span>
              </label>
            </div>
            {filters && (
              <section
                className="cq-filter-panel"
                id="catalog-filters"
                aria-label="Panel de filtros"
              >
                <header className="cq-filter-header">
                  <strong>
                    <CatalogGlyph name="filter" /> Filtros
                  </strong>
                  <button
                    type="button"
                    className="cq-action"
                    aria-label="Cerrar filtros"
                    title="Contraer filtros"
                    onClick={() => setFilters(false)}
                  >
                    <CatalogGlyph name="chevron" />
                  </button>
                </header>
                <div className="cq-filter-scroll">
                  <div className="cq-filter-primary">
                    {' '}
                    <CatalogChoices
                      label="Curso"
                      value={q.filter.courses?.[0] ?? ''}
                      onChange={(value) => filter('courses', value)}
                      options={[
                        ['', 'Todos los cursos'],
                        ...[1, 2, 3, 4].map((n) => [`eso${n}`, `${n}.º ESO`] as const),
                      ]}
                    />
                    <CatalogChoices
                      label="Frecuencia"
                      value={q.filter.frequencies?.[0] ?? ''}
                      onChange={(value) => filter('frequencies', value)}
                      options={[['', 'Todas'], ...Object.entries(frequency)]}
                    />
                  </div>
                  <details className="cq-filter-group">
                    <summary>
                      <CatalogGlyph name="pattern" />
                      <span>Relación y familias</span>
                      <CatalogGlyph name="chevron" size={13} />
                    </summary>{' '}
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
                  </details>
                  <details className="cq-filter-group">
                    <summary>
                      <CatalogGlyph name="chart" />
                      <span>Aprendizaje</span>
                      <CatalogGlyph name="chevron" size={13} />
                    </summary>
                    <CatalogChoices
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
                  </details>
                  <details className="cq-filter-group">
                    <summary>
                      <CatalogGlyph name="tag" />
                      <span>Temas</span>
                      <CatalogGlyph name="chevron" size={13} />
                    </summary>{' '}
                    <CatalogChoices
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
                  </details>
                  <details className="cq-filter-group">
                    <summary>
                      <CatalogGlyph name="sound" />
                      <span>Escritura y sonido</span>
                      <CatalogGlyph name="chevron" size={13} />
                    </summary>
                    <div className="cq-sound-filters">
                      {' '}
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
                                    form: e.target.value as
                                      'base' | 'pastSimple' | 'pastParticiple',
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
                          aria-label={
                            settings.strictIpa ? 'Sonido final (IPA validada)' : 'Sonido final'
                          }
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
                    </div>
                  </details>
                </div>
                <footer className="cq-filter-footer">
                  <IpaHelpButton />
                  <button type="button" className="cq-reset" onClick={clearFilters}>
                    <CatalogGlyph name="restore" />
                    <span>Restablecer</span>
                  </button>
                  <button type="button" className="cq-done" onClick={() => setFilters(false)}>
                    Ver {result.total} verbos <CatalogGlyph name="check" />
                  </button>
                </footer>
              </section>
            )}
            {filterCount > 0 && (
              <div className="chips cq-active-filters">
                {familySelection !== null && (
                  <button
                    type="button"
                    className="chip cq-pattern"
                    aria-label="Quitar filtro de familias"
                    onClick={() => setFamilySelection(null)}
                  >
                    <CatalogGlyph name="pattern" size={12} />
                    <span>Familias ({familySelection.length})</span>
                    <CatalogGlyph name="close" size={12} />
                  </button>
                )}
                {active.map(([key, values]) => {
                  const names: Record<string, string> = {
                    courses: 'curso',
                    frequencies: 'frecuencia',
                    states: 'aprendizaje',
                    topics: 'tema',
                    spelling: 'terminación escrita',
                    phonetic: 'sonido final',
                    listIds: 'lista',
                    relations: 'relación',
                  };
                  const symbols: Record<string, string> = {
                    courses: 'study',
                    frequencies: 'bolt',
                    states: 'chart',
                    topics: 'tag',
                    spelling: 'edit',
                    phonetic: 'sound',
                    listIds: 'book',
                    relations: 'pattern',
                  };
                  const description = values
                    .map((value: unknown) =>
                      typeof value === 'string'
                        ? key === 'topics'
                          ? topicLabel(value)
                          : key === 'listIds'
                            ? (lists.find((l) => l.id === value)?.name ?? value)
                            : key === 'courses'
                              ? `${value.replace('eso', '')}.º ESO`
                              : (frequency[value] ??
                                relationLabels[value] ??
                                stateLabels[value as keyof typeof stateLabels] ??
                                value)
                        : (value as { ending?: string }).ending,
                    )
                    .join(', ');
                  return (
                    <button
                      type="button"
                      key={key}
                      className={`chip ${
                        key === 'courses'
                          ? 'cq-course'
                          : key === 'frequencies'
                            ? 'cq-frequency'
                            : key === 'relations'
                              ? 'cq-pattern'
                              : key === 'topics' || key === 'listIds'
                                ? 'cq-course'
                                : key === 'states'
                                  ? 'cq-frequency'
                                  : 'cq-pattern'
                      }`}
                      aria-label={`Quitar ${names[key] ?? key}: ${description}`}
                      title={`Quitar ${names[key] ?? key}: ${description}`}
                      onClick={() => {
                        setQ({ ...q, filter: { ...q.filter, [key]: [] } });
                        if (key === 'relations') setFamilySelection(null);
                      }}
                    >
                      <CatalogGlyph name={symbols[key] ?? 'filter'} size={12} />
                      <span className="cq-chip-value">
                        {key === 'relations' ? description.split(' · ')[0] : description}
                      </span>
                      <CatalogGlyph name="close" size={12} />
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="chip"
                  aria-label="Limpiar filtros"
                  title="Limpiar filtros"
                  onClick={clearFilters}
                >
                  <CatalogGlyph name="restore" size={13} />
                  <span className="cq-control-label">Limpiar</span>
                </button>
              </div>
            )}
          </div>
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
              <CatalogEntry
                key={v.id}
                verb={v}
                compact={viewMode === 'compact'}
                dialect={settings.dialect}
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
    </div>
  );
}
