import { EditorAudioPreview, type EditorPreview } from './EditorAudioPreview';
import { AudioControls } from '../audio/AudioControls';
import { getVerbIcon, verbIconOptions } from './verb-icons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type {
  FormKey,
  Example,
  Pronunciation,
  Source,
  Variant,
  Verb,
  VerbDefinition,
} from '../../shared/domain/types';
import { Icon } from '../../shared/ui/Icon';
import { createId } from '../../shared/identity/create-id';

export const editorSections = [
  ['identity', 'Datos del verbo', 'edit'],
  ['forms', 'Formas y sonidos', 'sound'],
  ['classification', 'Clasificación', 'filter'],
  ['examples', 'Ejemplos', 'book'],
  ['notes', 'Notas y pistas', 'star'],
  ['sources', 'Fuentes', 'book'],
  ['metadata', 'Registro', 'clock'],
  ['json', 'JSON', 'settings'],
] as const;
export type EditorSection = (typeof editorSections)[number][0];
type Change = (verb: Verb) => void;
export function EditorField({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
  disabled = false,
  placeholder,
  action,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  action?: ReactNode;
}) {
  const props = {
    'aria-label': label,
    value,
    required,
    disabled,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange?.(e.target.value),
  };
  const field = (
    <label className="ve-field">
      {label}
      {multiline ? <textarea rows={3} {...props} /> : <input {...props} />}
    </label>
  );
  return action ? (
    <div className="ve-field-preview">
      {field}
      {action}
    </div>
  ) : (
    field
  );
}
export function EditorSelect({
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
  return (
    <label className="ve-field">
      {label}
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function EditorStrings({
  label,
  values,
  onChange,
  separator = '\n',
  singleLine = false,
}: {
  label: string;
  values: string[];
  onChange: (value: string[]) => void;
  separator?: string;
  singleLine?: boolean;
}) {
  const format = (value: string[]) => value.join(separator === '\n' ? '\n' : `${separator} `);
  const [text, setText] = useState(() => format(values));
  const signature = JSON.stringify(values);
  const last = useRef(signature);
  useEffect(() => {
    if (last.current !== signature) setText(format(values));
    last.current = signature;
  }, [signature]);
  return (
    <EditorField
      label={label}
      multiline={!singleLine}
      value={text}
      onChange={(raw) => {
        setText(raw);
        const next = raw
          .split(separator)
          .map((x) => x.trim())
          .filter(Boolean);
        last.current = JSON.stringify(next);
        onChange(next);
      }}
    />
  );
}
function RowHeader({
  title,
  onRemove,
  removeLabel,
  disabled = false,
}: {
  title: string;
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="ve-row-head">
      <h3>{title}</h3>
      {onRemove && (
        <button
          type="button"
          className="secondary ve-remove"
          disabled={disabled}
          aria-label={removeLabel ?? `Eliminar ${title}`}
          title={removeLabel ?? `Eliminar ${title}`}
          onClick={onRemove}
        >
          <Icon name="trash" size={15} />
          <span className="ve-action-label">Eliminar</span>
        </button>
      )}
    </div>
  );
}
function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="secondary" onClick={onClick}>
      <Icon name="plus" size={15} />
      {children}
    </button>
  );
}
function optional<T extends object, K extends keyof T>(
  object: T,
  key: K,
  value: T[K] | undefined,
): T {
  const next = { ...object };
  if (value === undefined || value === '') delete next[key];
  else next[key] = value;
  return next;
}
export function NullableAudio({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null | undefined) => void;
}) {
  const state = value === undefined ? 'unset' : value === null ? 'null' : 'url';
  return (
    <>
      <EditorSelect
        label={`${label}: estado`}
        value={state}
        options={[
          ['unset', 'Sin indicar'],
          ['null', 'Sin audio (nulo)'],
          ['url', 'URL de audio'],
        ]}
        onChange={(v) => onChange(v === 'unset' ? undefined : v === 'null' ? null : '')}
      />
      {state === 'url' && (
        <EditorField
          label={`${label}: URL`}
          value={value ?? ''}
          onChange={onChange}
          placeholder="https://…"
        />
      )}
    </>
  );
}
function PronunciationFields({
  label,
  value,
  onChange,
  action,
}: {
  label: string;
  value: Pronunciation;
  onChange: (value: Pronunciation) => void;
  action?: ReactNode;
}) {
  return (
    <div className="ve-grid">
      <EditorField
        label={`IPA ${label}`}
        action={action}
        value={value.ipa ?? ''}
        onChange={(v) => onChange(optional(value, 'ipa', v))}
      />
      <EditorSelect
        label={`Validación IPA ${label}`}
        value={value.validated === undefined ? '' : String(value.validated)}
        options={[
          ['', 'Sin indicar'],
          ['false', 'Pendiente de validar'],
          ['true', 'Validada'],
        ]}
        onChange={(v) =>
          onChange(optional(value, 'validated', v === '' ? undefined : v === 'true'))
        }
      />
      <details className="ve-advanced ve-wide">
        <summary>Audio {label}</summary>
        <div className="ve-grid">
          <NullableAudio
            label={`Audio ${label}`}
            value={value.audioUrl}
            onChange={(v) => {
              const next = { ...value };
              if (v === undefined) delete next.audioUrl;
              else next.audioUrl = v;
              onChange(next);
            }}
          />
          <EditorField
            label={`Fuente del audio ${label}`}
            value={value.audioSource ?? ''}
            onChange={(v) => onChange(optional(value, 'audioSource', v))}
          />
          <EditorField
            label={`Licencia del audio ${label}`}
            value={value.audioLicense ?? ''}
            onChange={(v) => onChange(optional(value, 'audioLicense', v))}
          />
        </div>
      </details>
    </div>
  );
}
function Pronunciations({
  name,
  value,
  onChange,
  preview,
}: {
  name: string;
  value: Variant['pronunciation'];
  onChange: (value: NonNullable<Variant['pronunciation']>) => void;
  preview?: { audio: EditorPreview; form: FormKey; value: string };
}) {
  return (
    <div className="ve-pronunciation-grid">
      {(['uk', 'us'] as const).map((dialect) => (
        <details className="ve-pronunciation" open key={dialect}>
          <summary>{dialect.toUpperCase()} · Fonética y audio</summary>
          <PronunciationFields
            action={
              preview && (
                <EditorAudioPreview
                  audio={preview.audio}
                  form={preview.form}
                  value={preview.value}
                  dialect={dialect}
                  label={`Probar pronunciación ${dialect.toUpperCase()} de ${name}`}
                />
              )
            }
            label={`${dialect.toUpperCase()} ${name === 'infinitivo' ? 'del infinitivo' : `de ${name}`}`}
            value={value?.[dialect] ?? {}}
            onChange={(p) => onChange({ ...value, [dialect]: p })}
          />
        </details>
      ))}
    </div>
  );
}
type Group = { variants: Variant[]; usageNotes?: string[] };
function VariantGroup({
  title,
  group,
  onChange,
  quickEdit,
  audio,
  form,
}: {
  title: string;
  group: Group;
  onChange: (group: Group) => void;
  quickEdit?: ReactNode;
  audio?: EditorPreview;
  form?: FormKey;
}) {
  return (
    <section className="ve-card">
      <RowHeader title={title} />
      {quickEdit}
      <div className="ve-rows">
        {group.variants.map((variant, index) => {
          const name = `${title.toLowerCase()}, variante ${index + 1}`;
          const update = (next: Variant) =>
            onChange({
              ...group,
              variants: group.variants.map((v, i) => (i === index ? next : v)),
            });
          return (
            <section className="ve-card" key={index}>
              <RowHeader
                title={`Variante ${index + 1}`}
                removeLabel={`Eliminar ${name}`}
                disabled={group.variants.length === 1}
                onRemove={() =>
                  onChange({ ...group, variants: group.variants.filter((_, i) => i !== index) })
                }
              />
              <div className="ve-grid">
                <EditorField
                  label={`Escritura de ${name}`}
                  action={
                    audio &&
                    form && (
                      <EditorAudioPreview
                        audio={audio}
                        form={form}
                        value={variant.value}
                        label={`Probar ${name}`}
                      />
                    )
                  }
                  value={variant.value}
                  required
                  onChange={(v) => update({ ...variant, value: v })}
                />
                <EditorField
                  label={`Traducción de ${variant.value || title.toLowerCase()} (${title === 'Pasado simple' ? 'pasado' : title === 'Participio pasado' ? 'participio' : title.toLowerCase()})`}
                  value={variant.translation ?? ''}
                  onChange={(v) => update(optional(variant, 'translation', v))}
                />
                <EditorSelect
                  label={`Dialecto de ${name}`}
                  value={variant.dialect ?? ''}
                  options={[
                    ['', 'Sin indicar'],
                    ['all', 'Todos'],
                    ['uk', 'UK'],
                    ['us', 'US'],
                    ['other', 'Otro'],
                  ]}
                  onChange={(v) => update(optional(variant, 'dialect', v as Variant['dialect']))}
                />
                <EditorField
                  label={`Nota de uso de ${name}`}
                  value={variant.usageNote ?? ''}
                  onChange={(v) => update(optional(variant, 'usageNote', v))}
                />
              </div>
              <Pronunciations
                name={name}
                preview={audio && form ? { audio, form, value: variant.value } : undefined}
                value={variant.pronunciation}
                onChange={(p) => update({ ...variant, pronunciation: p })}
              />
            </section>
          );
        })}
      </div>
      <div className="ve-actions">
        <AddButton
          onClick={() =>
            onChange({ ...group, variants: [...group.variants, { value: '', dialect: 'all' }] })
          }
        >
          Añadir variante de {title.toLowerCase()}
        </AddButton>
      </div>
      <EditorStrings
        label={`Notas generales de ${title.toLowerCase()}`}
        values={group.usageNotes ?? []}
        onChange={(v) => onChange(optional(group, 'usageNotes', v.length ? v : undefined))}
      />
    </section>
  );
}
function EndingMap({
  label,
  value,
  onChange,
  onValidity,
}: {
  label: string;
  value: Record<string, string[]>;
  onChange: (value: Record<string, string[]>) => void;
  onValidity: (error: string) => void;
}) {
  const [rows, setRows] = useState(() =>
    Object.entries(value).map(([name, endings]) => ({ name, endings })),
  );
  const [error, setError] = useState('');
  function update(next: typeof rows) {
    setRows(next);
    const keys = next.map((row) => row.name.trim());
    const invalid =
      keys.some((key) => !key || ['__proto__', 'constructor', 'prototype'].includes(key)) ||
      new Set(keys).size !== keys.length;
    const message = invalid ? `${label}: cada clave debe ser distinta, no vacía y válida.` : '';
    setError(message);
    onValidity(message);
    if (!invalid) onChange(Object.fromEntries(next.map((row, i) => [keys[i], row.endings])));
  }
  return (
    <section className="ve-card">
      <h3>{label}</h3>
      {rows.map((row, index) => (
        <div className="ve-card" key={index}>
          <RowHeader
            title={`Grupo ${index + 1}`}
            onRemove={() => update(rows.filter((_, i) => i !== index))}
          />
          <div className="ve-grid">
            <EditorField
              label={`Clave de ${label.toLowerCase()} ${index + 1}`}
              value={row.name}
              onChange={(name) => update(rows.map((r, i) => (i === index ? { ...r, name } : r)))}
            />
            <EditorStrings
              label={`Valores de ${label.toLowerCase()} ${index + 1}`}
              values={row.endings}
              onChange={(endings) =>
                update(rows.map((r, i) => (i === index ? { ...r, endings } : r)))
              }
            />
          </div>
        </div>
      ))}
      {error && (
        <p className="ve-error" role="alert">
          {error}
        </p>
      )}
      <AddButton onClick={() => update([...rows, { name: '', endings: [] }])}>
        Añadir grupo de {label.toLowerCase()}
      </AddButton>
    </section>
  );
}
function DefinitionFields({
  definitions,
  onChange,
}: {
  definitions: VerbDefinition[];
  onChange: (next: VerbDefinition[]) => void;
}) {
  function update(index: number, patch: Partial<VerbDefinition>, changed = true) {
    onChange(
      definitions.map((row, i) =>
        i === index
          ? { ...row, ...patch, ...(changed ? { reviewStatus: 'needs_review' as const } : {}) }
          : row,
      ),
    );
  }
  return (
    <section className="ve-card ve-definition-editor">
      <div className="ve-row-head">
        <h3>
          <Icon name="book" size={17} />
          Definiciones en inglés
        </h3>
      </div>
      <p className="small muted">
        Sentidos principales en inglés sencillo. Si el texto coincide, la ficha muestra una sola
        definición con ambas etiquetas. Modificar el contenido lo deja pendiente de revisión.
      </p>
      {definitions.map((definition, index) => (
        <fieldset className="ve-card" key={index}>
          <legend>Definición {index + 1}</legend>
          <div className="ve-row-head">
            <span className="small muted">Sentido {index + 1}</span>
            <button
              type="button"
              className="secondary"
              aria-label={`Eliminar definición ${index + 1}`}
              onClick={() => onChange(definitions.filter((_, i) => i !== index))}
            >
              <Icon name="trash" size={15} />
              Eliminar
            </button>
          </div>
          <EditorField
            label={`Texto de definición ${index + 1}`}
            value={definition.text}
            multiline
            onChange={(text) => update(index, { text })}
          />
          <div className="ve-grid">
            <fieldset className="ve-card">
              <legend>Uso de definición {index + 1}</legend>
              {(['uk', 'us'] as const).map((dialect) => (
                <label className="ve-check" key={dialect}>
                  <input
                    type="checkbox"
                    aria-label={`${dialect.toUpperCase()} de definición ${index + 1}`}
                    checked={definition.dialects.includes(dialect)}
                    onChange={(e) =>
                      update(index, {
                        dialects: e.target.checked
                          ? [...definition.dialects, dialect]
                          : definition.dialects.filter((d) => d !== dialect),
                      })
                    }
                  />
                  {dialect.toUpperCase()}
                </label>
              ))}
            </fieldset>
            <EditorSelect
              label={`Revisión de definición ${index + 1}`}
              value={definition.reviewStatus}
              options={[
                ['draft', 'Borrador'],
                ['needs_review', 'Pendiente de revisión'],
                ['validated', 'Revisada'],
              ]}
              onChange={(reviewStatus) =>
                update(
                  index,
                  { reviewStatus: reviewStatus as VerbDefinition['reviewStatus'] },
                  false,
                )
              }
            />
          </div>
          {definition.sources.map((source, sourceIndex) => (
            <fieldset className="ve-card" key={sourceIndex}>
              <legend>
                Fuente {sourceIndex + 1} de definición {index + 1}
              </legend>
              <div className="ve-grid">
                {(['label', 'url', 'license', 'checkedAt'] as const).map((key) => (
                  <EditorField
                    key={key}
                    label={`${{ label: 'Descripción', url: 'URL', license: 'Licencia', checkedAt: 'Fecha de consulta (AAAA-MM-DD)' }[key]} de fuente ${sourceIndex + 1} de definición ${index + 1}`}
                    value={source[key] ?? ''}
                    onChange={(value) =>
                      update(index, {
                        sources: definition.sources.map((row, i) =>
                          i === sourceIndex ? optional(row, key, value) : row,
                        ),
                      })
                    }
                  />
                ))}
              </div>
              <button
                type="button"
                className="secondary"
                aria-label={`Eliminar fuente ${sourceIndex + 1} de definición ${index + 1}`}
                onClick={() =>
                  update(index, { sources: definition.sources.filter((_, i) => i !== sourceIndex) })
                }
              >
                <Icon name="trash" size={15} />
                Eliminar fuente
              </button>
            </fieldset>
          ))}
          <AddButton
            onClick={() => update(index, { sources: [...definition.sources, { label: '' }] })}
          >
            Añadir fuente a definición {index + 1}
          </AddButton>
        </fieldset>
      ))}
      <AddButton
        onClick={() =>
          onChange([
            ...definitions,
            { text: '', dialects: ['uk', 'us'], sources: [], reviewStatus: 'needs_review' },
          ])
        }
      >
        Añadir definición
      </AddButton>
    </section>
  );
}
export function VerbEditorFields({
  verb,
  change,
  section,
  existing,
  editedVariants,
  onValidity,
  preview,
}: {
  verb: Verb;
  change: Change;
  section: EditorSection;
  existing: boolean;
  editedVariants: (form: 'pastSimple' | 'pastParticiple', text: string) => Variant[];
  onValidity: (key: string, message: string) => void;
  preview: EditorPreview;
}) {
  const classification = verb.classification;
  const updateForms = (forms: Verb['forms']) => change({ ...verb, forms });
  const updateClassification = (value: Verb['classification']) =>
    change({ ...verb, classification: value });
  function exampleChange(index: number, next: Example) {
    change({ ...verb, examples: verb.examples.map((ex, i) => (index === i ? next : ex)) });
  }
  function sourceChange(index: number, next: Source) {
    change({ ...verb, sources: verb.sources.map((source, i) => (index === i ? next : source)) });
  }
  return (
    <div className="ve-content">
      <section className="ve-section" hidden={section !== 'identity'}>
        <h2>Datos del verbo</h2>
        <section className="ve-icon-picker ve-card">
          <div className="ve-row-head">
            <h3>Icono del verbo</h3>
            <span className="ve-icon-current" aria-hidden="true">
              {getVerbIcon(verb)}
            </span>
          </div>
          <EditorField
            label="Icono representativo"
            value={verb.icon ?? ''}
            placeholder={getVerbIcon({ ...verb, icon: undefined })}
            onChange={(value) => change(optional(verb, 'icon', value.trim() || undefined))}
          />
          <p className="small muted">
            Elige un icono o escribe un símbolo o emoji. Se mostrará en el catálogo y en la ficha.
          </p>
          <div className="ve-icon-options" role="group" aria-label="Iconos disponibles">
            {verbIconOptions.map((icon) => (
              <button
                key={icon}
                type="button"
                className="secondary ve-icon-choice"
                aria-label={`Elegir icono ${icon}`}
                title={`Elegir icono ${icon}`}
                aria-pressed={verb.icon === icon}
                onClick={() => change({ ...verb, icon })}
              >
                {icon}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="secondary"
            disabled={!verb.icon}
            onClick={() => change(optional(verb, 'icon', undefined))}
          >
            Usar icono automático
          </button>
        </section>
        <div className="ve-grid">
          <EditorField
            label="Identificador estable"
            value={verb.id}
            disabled={existing}
            onChange={(id) => change({ ...verb, id })}
            required
          />
          <EditorField
            label="Forma base"
            value={verb.lemma}
            required
            onChange={(lemma) =>
              change({
                ...verb,
                lemma,
                forms: {
                  ...verb.forms,
                  base: {
                    ...verb.forms.base,
                    value: verb.forms.base.value === verb.lemma ? lemma : verb.forms.base.value,
                  },
                },
              })
            }
          />
          <div className="ve-wide">
            <EditorStrings
              label="Significados (separados por ;)"
              values={verb.meanings}
              separator=";"
              singleLine
              onChange={(meanings) => change({ ...verb, meanings })}
            />
          </div>
          <EditorField
            label="Notas de significado"
            value={verb.meaningNotes ?? ''}
            multiline
            onChange={(value) => change(optional(verb, 'meaningNotes', value))}
          />
          <EditorSelect
            label="Estado de revisión"
            value={verb.editorialStatus}
            options={[
              ['draft', 'Borrador'],
              ['needs_review', 'Pendiente de revisión'],
              ['validated', 'Revisado'],
            ]}
            onChange={(value) =>
              change({ ...verb, editorialStatus: value as Verb['editorialStatus'] })
            }
          />
        </div>
        <DefinitionFields
          definitions={verb.definitions ?? []}
          onChange={(definitions) => change({ ...verb, definitions })}
        />
        <p className="small muted">
          El lema y la escritura del infinitivo se pueden diferenciar en Formas y sonidos. Cada
          línea de una lista representa un elemento independiente.
        </p>
      </section>
      <section className="ve-section" hidden={section !== 'forms'}>
        <h2>Formas y sonidos</h2>
        <p className="small muted">
          Prueba el borrador con la misma voz que la biblioteca. La IPA no modifica la voz
          sintética.
        </p>
        <section className="ve-card">
          <h3>Infinitivo</h3>
          <div className="ve-grid">
            <EditorField
              label="Escritura del infinitivo"
              action={
                <EditorAudioPreview
                  audio={preview}
                  form="base"
                  value={verb.forms.base.value}
                  label="Probar infinitivo"
                />
              }
              value={verb.forms.base.value}
              required
              onChange={(value) =>
                updateForms({ ...verb.forms, base: { ...verb.forms.base, value } })
              }
            />
            <EditorField
              label={`Traducción de ${verb.forms.base.value || 'base'} (infinitivo)`}
              value={verb.forms.base.translation ?? ''}
              onChange={(value) =>
                updateForms({
                  ...verb.forms,
                  base: optional(verb.forms.base, 'translation', value),
                })
              }
            />
          </div>
          <Pronunciations
            name="infinitivo"
            preview={{ audio: preview, form: 'base', value: verb.forms.base.value }}
            value={verb.forms.base.pronunciation}
            onChange={(pronunciation) =>
              updateForms({
                ...verb.forms,
                base: {
                  ...verb.forms.base,
                  pronunciation: { ...verb.forms.base.pronunciation, ...pronunciation },
                },
              })
            }
          />
          <details className="ve-advanced">
            <summary>Otras pronunciaciones del infinitivo</summary>
            {(verb.forms.base.pronunciation?.other ?? []).map((p, index) => (
              <section className="ve-card" key={index}>
                <RowHeader
                  title={`Pronunciación adicional ${index + 1}`}
                  onRemove={() => {
                    const pronunciation = {
                      ...verb.forms.base.pronunciation,
                      other: verb.forms.base.pronunciation!.other!.filter((_, i) => i !== index),
                    };
                    updateForms({ ...verb.forms, base: { ...verb.forms.base, pronunciation } });
                  }}
                />
                <PronunciationFields
                  label={`adicional ${index + 1} del infinitivo`}
                  value={p}
                  onChange={(value) =>
                    updateForms({
                      ...verb.forms,
                      base: {
                        ...verb.forms.base,
                        pronunciation: {
                          ...verb.forms.base.pronunciation,
                          other: verb.forms.base.pronunciation!.other!.map((p, i) =>
                            index === i ? value : p,
                          ),
                        },
                      },
                    })
                  }
                />
              </section>
            ))}
            <AddButton
              onClick={() =>
                updateForms({
                  ...verb.forms,
                  base: {
                    ...verb.forms.base,
                    pronunciation: {
                      ...verb.forms.base.pronunciation,
                      other: [...(verb.forms.base.pronunciation?.other ?? []), {}],
                    },
                  },
                })
              }
            >
              Añadir pronunciación del infinitivo
            </AddButton>
          </details>
        </section>
        {(['pastSimple', 'pastParticiple'] as const).map((form, index) => (
          <VariantGroup
            key={form}
            title={index ? 'Participio pasado' : 'Pasado simple'}
            group={verb.forms[form]}
            form={form}
            audio={preview}
            onChange={(group) => updateForms({ ...verb.forms, [form]: group })}
            quickEdit={
              <EditorField
                label={`${index ? 'Participio pasado' : 'Pasado simple'} (variantes separadas por /)`}
                value={verb.forms[form].variants.map((v) => v.value).join(' / ')}
                onChange={(value) =>
                  updateForms({
                    ...verb.forms,
                    [form]: { ...verb.forms[form], variants: editedVariants(form, value) },
                  })
                }
              />
            }
          />
        ))}
        {(['thirdPersonSingular', 'presentParticiple'] as const).map((form, index) => {
          const title = index ? 'Gerundio' : 'Tercera persona';
          return (
            <div key={form}>
              {verb.forms[form] ? (
                <>
                  <VariantGroup
                    title={title}
                    group={verb.forms[form]!}
                    onChange={(group) => updateForms({ ...verb.forms, [form]: group })}
                  />
                  <button
                    type="button"
                    className="secondary ve-remove"
                    onClick={() => {
                      const forms = { ...verb.forms };
                      delete forms[form];
                      updateForms(forms);
                    }}
                  >
                    <Icon name="trash" size={15} />
                    Quitar {title.toLowerCase()}
                  </button>
                </>
              ) : (
                <AddButton
                  onClick={() =>
                    updateForms({
                      ...verb.forms,
                      [form]: { variants: [{ value: '', dialect: 'all' }] },
                    })
                  }
                >
                  Añadir {title.toLowerCase()}
                </AddButton>
              )}
            </div>
          );
        })}
        <section className="ve-card">
          <h3>Otras formas etiquetadas</h3>
          {(verb.forms.otherForms ?? []).map((form, index) => (
            <div className="ve-card" key={index}>
              <RowHeader
                title={`Forma adicional ${index + 1}`}
                onRemove={() =>
                  updateForms({
                    ...verb.forms,
                    otherForms: verb.forms.otherForms!.filter((_, i) => i !== index),
                  })
                }
              />
              <EditorField
                label={`Etiqueta de la forma adicional ${index + 1}`}
                value={form.label}
                onChange={(label) =>
                  updateForms({
                    ...verb.forms,
                    otherForms: verb.forms.otherForms!.map((g, i) =>
                      i === index ? { ...g, label } : g,
                    ),
                  })
                }
              />
              <VariantGroup
                title={`Forma adicional ${index + 1}`}
                group={form.group}
                onChange={(group) =>
                  updateForms({
                    ...verb.forms,
                    otherForms: verb.forms.otherForms!.map((g, i) =>
                      i === index ? { ...g, group } : g,
                    ),
                  })
                }
              />
            </div>
          ))}
          <AddButton
            onClick={() =>
              updateForms({
                ...verb.forms,
                otherForms: [
                  ...(verb.forms.otherForms ?? []),
                  { label: '', group: { variants: [{ value: '' }] } },
                ],
              })
            }
          >
            Añadir forma etiquetada
          </AddButton>
        </section>
      </section>
      <section className="ve-section" hidden={section !== 'classification'}>
        <h2>Clasificación</h2>
        <div className="ve-grid">
          <div className="ve-tone-purple">
            <EditorSelect
              label="Relación de formas"
              value={classification.formRelation}
              options={[
                ['all_same', 'AAA · Tres iguales'],
                ['past_participle_same', 'ABB · Pasado y participio iguales'],
                ['all_different', 'ABC · Tres diferentes'],
                ['special', 'Especiales'],
              ]}
              onChange={(v) =>
                updateClassification({
                  ...classification,
                  formRelation: v as Verb['classification']['formRelation'],
                })
              }
            />
          </div>
          <div className="ve-tone-gold">
            <EditorSelect
              label="Frecuencia"
              value={classification.frequencyBand}
              options={[
                ['essential', 'Esencial'],
                ['common', 'Frecuente'],
                ['less_common', 'Menos frecuente'],
                ['advanced', 'Avanzado'],
              ]}
              onChange={(v) =>
                updateClassification({
                  ...classification,
                  frequencyBand: v as Verb['classification']['frequencyBand'],
                })
              }
            />
          </div>
          <fieldset className="ve-card ve-tone-teal">
            <legend>Cursos recomendados</legend>
            {[1, 2, 3, 4].map((n) => (
              <label className="ve-check" key={n}>
                <input
                  type="checkbox"
                  checked={classification.recommendedCourses.includes(`eso${n}`)}
                  onChange={(e) =>
                    updateClassification({
                      ...classification,
                      recommendedCourses: e.target.checked
                        ? [...classification.recommendedCourses, `eso${n}`]
                        : classification.recommendedCourses.filter((c) => c !== `eso${n}`),
                    })
                  }
                />
                {n}.º ESO
              </label>
            ))}
          </fieldset>
          <div className="ve-tone-gold">
            <EditorSelect
              label="Dificultad"
              value={classification.difficulty ?? ''}
              options={[
                ['', 'Sin indicar'],
                ['introductory', 'Inicial'],
                ['intermediate', 'Intermedia'],
                ['advanced', 'Avanzada'],
              ]}
              onChange={(value) =>
                updateClassification(
                  optional(
                    classification,
                    'difficulty',
                    value as Verb['classification']['difficulty'],
                  ),
                )
              }
            />
          </div>
          <div className="ve-tone-purple">
            <EditorStrings
              label="Familias y patrones (uno por línea)"
              values={classification.patternGroups}
              onChange={(patternGroups) =>
                updateClassification({ ...classification, patternGroups })
              }
            />
          </div>
          <div className="ve-tone-teal">
            <EditorStrings
              label="Temas (uno por línea)"
              values={classification.topics ?? []}
              onChange={(topics) =>
                updateClassification(
                  optional(classification, 'topics', topics.length ? topics : undefined),
                )
              }
            />
          </div>
        </div>
        <EndingMap
          label="Terminaciones escritas"
          value={classification.spellingEndings ?? {}}
          onChange={(value) =>
            updateClassification(
              optional(
                classification,
                'spellingEndings',
                Object.keys(value).length ? value : undefined,
              ),
            )
          }
          onValidity={(message) => onValidity('spellingEndings', message)}
        />
        <EndingMap
          label="Terminaciones fonéticas"
          value={classification.phoneticEndings ?? {}}
          onChange={(value) =>
            updateClassification(
              optional(
                classification,
                'phoneticEndings',
                Object.keys(value).length ? value : undefined,
              ),
            )
          }
          onValidity={(message) => onValidity('phoneticEndings', message)}
        />
      </section>
      <section className="ve-section" hidden={section !== 'examples'}>
        <h2>Ejemplos</h2>
        {verb.examples.map((example, index) => {
          const n = index + 1;
          return (
            <section className="ve-card" key={index}>
              <RowHeader
                title={`Ejemplo ${n}`}
                onRemove={() =>
                  change({ ...verb, examples: verb.examples.filter((_, i) => i !== index) })
                }
              />
              <div className="ve-grid">
                {(
                  [
                    ['id', 'Identificador'],
                    ['sentence', 'Frase'],
                    ['translation', 'Traducción'],
                    ['targetForm', 'Forma objetivo'],
                    ['grammarPoint', 'Punto gramatical'],
                  ] as const
                ).map(([key, label]) => (
                  <EditorField
                    key={key}
                    label={`${label} del ejemplo ${n}`}
                    value={example[key]}
                    onChange={(value) => exampleChange(index, { ...example, [key]: value })}
                    multiline={key === 'sentence' || key === 'translation'}
                    action={
                      key === 'sentence' ? (
                        <div className="ve-example-audio">
                          <AudioControls
                            text={example.sentence}
                            label={`Probar frase del ejemplo ${n}`}
                            iconOnly
                          />
                        </div>
                      ) : undefined
                    }
                  />
                ))}
                <EditorSelect
                  label={`Tiempo verbal del ejemplo ${n}`}
                  value={example.form ?? ''}
                  options={[
                    ['', 'Sin indicar'],
                    ['base', 'Infinitivo'],
                    ['pastSimple', 'Pasado simple'],
                    ['pastParticiple', 'Participio pasado'],
                  ]}
                  onChange={(value) =>
                    exampleChange(index, optional(example, 'form', value as Example['form']))
                  }
                />
                <EditorSelect
                  label={`Dialecto del ejemplo ${n}`}
                  value={example.dialect ?? ''}
                  options={[
                    ['', 'Sin indicar'],
                    ['neutral', 'Neutro'],
                    ['uk', 'UK'],
                    ['us', 'US'],
                  ]}
                  onChange={(value) =>
                    exampleChange(index, optional(example, 'dialect', value as Example['dialect']))
                  }
                />
                <EditorSelect
                  label={`Revisión del ejemplo ${n}`}
                  value={example.reviewStatus}
                  options={[
                    ['draft', 'Borrador'],
                    ['needs_review', 'Pendiente'],
                    ['validated', 'Revisado'],
                  ]}
                  onChange={(value) =>
                    exampleChange(index, {
                      ...example,
                      reviewStatus: value as Example['reviewStatus'],
                    })
                  }
                />
                <EditorField
                  label={`Fuente del ejemplo ${n}`}
                  value={example.source ?? ''}
                  onChange={(value) => exampleChange(index, optional(example, 'source', value))}
                />
                <NullableAudio
                  label={`Audio del ejemplo ${n}`}
                  value={example.audioUrl}
                  onChange={(value) => {
                    const next = { ...example };
                    if (value === undefined) delete next.audioUrl;
                    else next.audioUrl = value;
                    exampleChange(index, next);
                  }}
                />
                <EditorStrings
                  label={`Respuestas aceptadas del ejemplo ${n}`}
                  values={example.acceptedAnswers ?? []}
                  onChange={(value) =>
                    exampleChange(
                      index,
                      optional(example, 'acceptedAnswers', value.length ? value : undefined),
                    )
                  }
                />
              </div>
            </section>
          );
        })}
        <AddButton
          onClick={() =>
            change({
              ...verb,
              examples: [
                ...verb.examples,
                {
                  id: createId(),
                  sentence: '',
                  translation: '',
                  targetForm: verb.forms.base.value,
                  grammarPoint: '',
                  reviewStatus: 'draft',
                },
              ],
            })
          }
        >
          Añadir ejemplo
        </AddButton>
      </section>
      <section className="ve-section" hidden={section !== 'notes'}>
        <h2>Notas y pistas</h2>
        <EditorStrings
          label="Pistas para recordar (una por línea)"
          values={verb.mnemonics ?? []}
          onChange={(value) =>
            change(optional(verb, 'mnemonics', value.length ? value : undefined))
          }
        />
        <EditorStrings
          label="Notas de uso"
          values={verb.notes ?? []}
          onChange={(value) => change(optional(verb, 'notes', value.length ? value : undefined))}
        />
      </section>
      <section className="ve-section" hidden={section !== 'sources'}>
        <h2>Fuentes</h2>
        {verb.sources.map((source, index) => (
          <section className="ve-card" key={index}>
            <RowHeader
              title={`Fuente ${index + 1}`}
              onRemove={() =>
                change({ ...verb, sources: verb.sources.filter((_, i) => i !== index) })
              }
            />
            <div className="ve-grid">
              {(
                [
                  ['label', 'Etiqueta'],
                  ['url', 'URL'],
                  ['license', 'Licencia'],
                  ['checkedAt', 'Fecha de consulta'],
                ] as const
              ).map(([key, label]) => (
                <EditorField
                  key={key}
                  label={`${label} de la fuente ${index + 1}`}
                  value={source[key] ?? ''}
                  placeholder={key === 'checkedAt' ? 'AAAA-MM-DD' : undefined}
                  onChange={(value) => sourceChange(index, optional(source, key, value))}
                />
              ))}
            </div>
          </section>
        ))}
        <AddButton onClick={() => change({ ...verb, sources: [...verb.sources, {}] })}>
          Añadir fuente
        </AddButton>
      </section>
      <section className="ve-section ve-metadata" hidden={section !== 'metadata'}>
        <h2>Registro</h2>
        <div className="ve-grid">
          <EditorField label="Versión del contenido" value={verb.contentVersion} disabled />
          <EditorField label="Última modificación" value={verb.updatedAt ?? ''} disabled />
          <EditorField
            label="Fecha de creación"
            value={verb.createdAt ?? ''}
            placeholder="AAAA-MM-DDTHH:mm:ssZ"
            onChange={(value) => change(optional(verb, 'createdAt', value))}
          />
          <EditorField
            label="Fecha de archivo (vacío = activo)"
            value={verb.archivedAt ?? ''}
            placeholder="AAAA-MM-DDTHH:mm:ssZ"
            onChange={(value) => change({ ...verb, archivedAt: value || null })}
          />
        </div>
        <p className="small muted">
          El identificador conserva los enlaces del historial. La versión y la fecha de modificación
          se generan al guardar. El archivado conserva las listas y las sesiones anteriores.
        </p>
      </section>
    </div>
  );
}
