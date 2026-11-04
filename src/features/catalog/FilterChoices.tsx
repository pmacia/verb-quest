import { useId } from 'react';
export function FilterChoices({
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
  return (
    <fieldset className="filter-choices">
      <legend>{label}</legend>
      <div className="filter-choice-options">
        {options.map(([id, text]) => (
          <label key={id} className="filter-choice">
            <input
              type="radio"
              name={name}
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
            />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
