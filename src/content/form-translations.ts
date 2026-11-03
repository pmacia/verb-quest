import translations from './form-translations.json';
import type { Verb, FormKey } from '../shared/domain/types';
const records = translations as Record<string, Record<FormKey, Record<string, string>>>;
/** Only the bundled catalogue receives authored translations, matched by exact spelling. */
export function applyFormTranslations(verbs: Verb[]): Verb[] {
  return structuredClone(verbs).map((verb) => {
    const record = records[verb.id];
    for (const form of ['base', 'pastSimple', 'pastParticiple'] as const) {
      const targets = form === 'base' ? [verb.forms.base] : verb.forms[form].variants;
      for (const target of targets) {
        const translation = record?.[form]?.[target.value];
        if (translation) target.translation = translation;
      }
    }
    return verb;
  });
}
