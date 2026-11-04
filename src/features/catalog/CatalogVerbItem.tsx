import { Link } from 'react-router-dom';
import type { Verb } from '../../shared/domain/types';
import { Icon } from '../../shared/ui/Icon';
import { VerbBadges } from './VerbBadges';
import { VerbForms, type PlayVerbForm } from './VerbForms';
export function CatalogVerbItem({
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
}: {
  verb: Verb;
  compact: boolean;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  editing: boolean;
  archived: boolean;
  restoring: boolean;
  onArchive: () => void;
  onRestore: () => void;
  playing: boolean;
  playingKey?: string | null;
  onPlayAll: () => void;
  onPlayForm: PlayVerbForm;
}) {
  const emoji: Record<string, string> = {
    read: '📖',
    write: '✍️',
    go: '🚶',
    eat: '🍽️',
    drink: '🥤',
    swim: '🏊',
    sing: '🎵',
    break: '💥',
    sleep: '💤',
    fly: '✈️',
    buy: '🛍️',
    see: '👁️',
  };
  return (
    <article
      className={`catalog-verb-item verb-row ${compact ? 'catalog-item-compact' : 'catalog-item-expanded'}${selected ? ' is-selected' : ''}`}
    >
      <header className="catalog-item-header">
        <div className="catalog-item-summary">
          <label className="catalog-select">
            <input
              type="checkbox"
              aria-label={`Seleccionar ${verb.lemma}`}
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
            />
          </label>
          <span className="verb-emblem" aria-hidden="true">
            {emoji[verb.lemma] ?? '✦'}
          </span>
          <div>
            <div className="catalog-item-title">
              <Link className="verb-base" to={`/verbs/${verb.id}`}>
                {verb.lemma}
                <span className="sr-only"> · Ver ficha</span>
              </Link>
              <span>{verb.meanings.join(' / ')}</span>
            </div>
            <VerbBadges verb={verb} />
          </div>
        </div>
        <div className="verb-row-actions">
          <button
            type="button"
            className="icon-button"
            aria-pressed={playing}
            aria-label={
              playing
                ? `Detener audio de ${verb.lemma}`
                : `Escuchar las tres formas de ${verb.lemma}`
            }
            title="Escuchar las tres formas"
            onClick={onPlayAll}
          >
            <Icon name="sound" size={20} />
          </button>
          {editing && (
            <>
              <Link
                className="icon-link"
                to={`/editor/verbs/${verb.id}`}
                aria-label={`Editar ${verb.lemma}`}
              >
                <Icon name="edit" size={20} />
              </Link>
              {archived ? (
                <button
                  className="icon-button"
                  aria-label={`Restaurar ${verb.lemma}`}
                  disabled={restoring}
                  onClick={onRestore}
                >
                  <Icon name="restore" size={20} />
                </button>
              ) : (
                <button
                  className="icon-button"
                  aria-label={`Quitar ${verb.lemma} del catálogo`}
                  onClick={onArchive}
                >
                  <Icon name="trash" size={20} />
                </button>
              )}
            </>
          )}
          <Link
            className="icon-link"
            to={`/verbs/${verb.id}`}
            aria-label={`Ver ficha de ${verb.lemma}`}
          >
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </header>
      <VerbForms verb={verb} compact={compact} onPlay={onPlayForm} playingKey={playingKey} />
      {!compact && (
        <footer className="catalog-item-footer">
          <span>{verb.mnemonics?.[0] ?? 'Compara sus formas y practica con una frase.'}</span>
          <Link to={`/verbs/${verb.id}`}>Ver ejemplos →</Link>
        </footer>
      )}
    </article>
  );
}
