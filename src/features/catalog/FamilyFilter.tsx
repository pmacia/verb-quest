import { useEffect, useRef } from 'react';
import type { Verb } from '../../shared/domain/types';
import { familyLabel, getFamilyOptions, type RelationScope } from './family-filter';

export function FamilyFilter({
  verbs,
  relation,
  selected,
  onRelation,
  onSelection,
}: {
  verbs: Verb[];
  relation: RelationScope;
  selected: string[] | null;
  onRelation: (relation: RelationScope) => void;
  onSelection: (selected: string[] | null) => void;
}) {
  const options = getFamilyOptions(verbs, relation);
  const ids = options.map((option) => option.id);
  const chosen = selected === null ? ids : ids.filter((id) => selected.includes(id));
  const all = chosen.length === ids.length && ids.length > 0;
  const partial = chosen.length > 0 && !all;
  const checkbox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (checkbox.current) checkbox.current.indeterminate = partial;
  }, [partial]);
  return (
    <fieldset className="family-filter">
      <legend>Relación de formas y familias</legend>
      <label>
        Relación de formas
        <select
          aria-label="Relación de formas"
          value={relation}
          onChange={(event) => onRelation(event.target.value as RelationScope)}
        >
          <option value="">Todas las relaciones</option>
          <option value="all_same">Tres iguales</option>
          <option value="past_participle_same">Pasado y participio iguales</option>
          <option value="all_different">Tres diferentes</option>
          <option value="special">Especiales</option>
        </select>
      </label>
      <p className="small muted">
        La relación selecciona sus familias. Desmarca las que quieras excluir. Un verbo puede
        pertenecer a varias familias.
      </p>
      <label className="family-choice family-select-all">
        <input
          ref={checkbox}
          type="checkbox"
          checked={all}
          disabled={!ids.length}
          onChange={(event) => onSelection(event.target.checked ? null : [])}
        />
        <span>Todas las familias</span>
      </label>
      <p className="small family-count">
        {chosen.length} de {ids.length} familias seleccionadas
      </p>
      <div className="family-options">
        {options.map((option) => (
          <label className="family-choice" key={option.id}>
            <input
              type="checkbox"
              aria-label={familyLabel(option.id)}
              checked={chosen.includes(option.id)}
              onChange={(event) => {
                const next = event.target.checked
                  ? [...chosen, option.id]
                  : chosen.filter((id) => id !== option.id);
                onSelection(next.length === ids.length ? null : next);
              }}
            />
            <span>
              {familyLabel(option.id)}{' '}
              <small>
                ({option.count} {option.count === 1 ? 'verbo' : 'verbos'})
              </small>
            </span>
          </label>
        ))}
        {!options.length && <p className="small muted">No hay familias en esta relación.</p>}
      </div>
    </fieldset>
  );
}
