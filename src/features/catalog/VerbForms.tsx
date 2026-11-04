import type { Verb, FormKey, Dialect } from '../../shared/domain/types';
import { useApp } from '../../app/app-context';
import { Icon } from '../../shared/ui/Icon';
export type PlayVerbForm = (form: FormKey, value?: string, dialect?: Dialect) => void;
const forms = ['base', 'pastSimple', 'pastParticiple'] as const;
export const formLabels: Record<FormKey, string> = {
  base: 'Infinitivo',
  pastSimple: 'Pasado simple',
  pastParticiple: 'Participio pasado',
};
export function VerbForms({
  verb,
  compact = false,
  translations = false,
  onPlay,
  playingKey = null,
}: {
  verb: Verb;
  compact?: boolean;
  translations?: boolean;
  onPlay: PlayVerbForm;
  playingKey?: string | null;
}) {
  const { settings } = useApp();
  return (
    <div className={compact ? 'verb-form-grid compact-forms' : 'verb-form-grid forms-grid'}>
      {forms.map((form, index) => {
        const variants = form === 'base' ? [verb.forms.base] : verb.forms[form].variants;
        return (
          <section
            className={`verb-form-column form-card form-color-${index}`}
            key={form}
            aria-label={formLabels[form]}
          >
            <span className="eyebrow">{formLabels[form]}</span>
            {variants.map((variant, variantIndex) => (
              <div className="verb-variant" key={`${variant.value}-${variantIndex}`}>
                <h2 lang="en">{variant.value}</h2>
                {translations && (
                  <p className="form-translation" lang="es">
                    {variant.translation ?? 'Traducción por completar'}
                  </p>
                )}
                <div className="pronunciation-list">
                  {(compact
                    ? [settings.dialect]
                    : ([settings.dialect, settings.dialect === 'uk' ? 'us' : 'uk'] as Dialect[])
                  ).map((dialect) => {
                    const p = variant.pronunciation?.[dialect];
                    const active =
                      playingKey === JSON.stringify([verb.id, form, variant.value, dialect]);
                    return (
                      <div className="verb-pronunciation" key={dialect}>
                        <span>
                          {p?.ipa ? (
                            <>
                              {variant.value} · IPA {dialect.toUpperCase()}:{' '}
                              <span className="ipa-text">{p.ipa}</span>
                            </>
                          ) : (
                            dialect.toUpperCase()
                          )}
                        </span>
                        <button
                          type="button"
                          className="secondary form-sound"
                          aria-pressed={active}
                          aria-label={`${active ? 'Detener' : 'Escuchar'} ${form} de ${verb.lemma}: ${variant.value} en ${dialect.toUpperCase()}`}
                          title={`${active ? 'Detener' : 'Escuchar'} ${variant.value} en ${dialect.toUpperCase()}`}
                          onClick={() => onPlay(form, variant.value, dialect)}
                        >
                          <span>{dialect.toUpperCase()}</span>
                          <Icon name="sound" size={16} />
                        </button>
                        {settings.showSources && p && !p.validated && (
                          <small>IPA propuesta · pendiente de revisión</small>
                        )}
                      </div>
                    );
                  })}
                </div>
                {'usageNote' in variant &&
                  typeof variant.usageNote === 'string' &&
                  variant.usageNote && <p className="small muted">{variant.usageNote}</p>}
              </div>
            ))}
            {!compact && translations && (
              <div className="form-card-actions">
                <button
                  type="button"
                  className="secondary"
                  aria-pressed={
                    playingKey === JSON.stringify([verb.id, form, undefined, undefined])
                  }
                  aria-label={`${playingKey === JSON.stringify([verb.id, form, undefined, undefined]) ? 'Detener' : 'Escuchar'} ${form} de ${verb.lemma}`}
                  onClick={() => onPlay(form)}
                >
                  <Icon name="sound" size={16} />
                  {playingKey === JSON.stringify([verb.id, form, undefined, undefined])
                    ? 'Detener'
                    : 'Escuchar'}
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
