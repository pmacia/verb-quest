import type { Verb, Dialect, FormKey, AppSettings } from '../../shared/domain/types';
import type { SpeechService, SpeechResult } from './speech-service';
export interface VerbAudioSegment {
  form: FormKey;
  text: string;
}
export type VerbAudioSettings = Pick<AppSettings, 'voiceURI' | 'dialect' | 'volume' | 'rate'> & {
  forceDialect?: boolean;
};
/** Homophones disambiguate the speech engine without changing the displayed/accepted spelling.
 * Oxford: read_1 /riːd/, /red/; reed /riːd/; red_1 /red/.
 * https://www.oxfordlearnersdictionaries.com/definition/english/read_1
 */
export function spokenForm(verb: Verb, form: FormKey, value: string): string {
  if (
    verb.forms.base.value.trim().toLowerCase() === 'read' &&
    value.trim().toLowerCase() === 'read'
  )
    return form === 'base' ? 'reed' : 'red';
  return value;
}
export function getVariantAudioSegment(verb: Verb, form: FormKey, value: string): VerbAudioSegment {
  const targets = form === 'base' ? [verb.forms.base] : verb.forms[form].variants;
  if (!targets.some((target) => target.value === value)) throw Error('Forma verbal no encontrada');
  return { form, text: spokenForm(verb, form, value) };
}
export function getVerbAudioSegment(
  verb: Verb,
  _dialect: Dialect,
  form: FormKey,
): VerbAudioSegment {
  const values =
    form === 'base' ? [verb.forms.base.value] : verb.forms[form].variants.map((v) => v.value);
  return {
    form,
    text: [...new Set(values.map((value) => spokenForm(verb, form, value)))].join(', '),
  };
}
export function getVerbAudioSegments(verb: Verb, dialect: Dialect): VerbAudioSegment[] {
  return (['base', 'pastSimple', 'pastParticiple'] as const).map((form) =>
    getVerbAudioSegment(verb, dialect, form),
  );
}
export function createVerbAudioPlayer(service: SpeechService) {
  let serial = 0;
  return {
    async play(
      segments: VerbAudioSegment[],
      settings: VerbAudioSettings,
      callbacks: {
        onStart?: (segment: VerbAudioSegment) => void;
        onCompleted?: (form: FormKey) => void | Promise<void>;
      } = {},
    ): Promise<SpeechResult> {
      const token = ++serial;
      service.cancel();
      let result: SpeechResult = { status: 'unavailable' };
      for (const segment of segments) {
        if (token !== serial) return { status: 'cancelled' };
        callbacks.onStart?.(segment);
        if (token !== serial) return { status: 'cancelled' };
        result = await service.play({
          text: segment.text,
          forceDialect: settings.forceDialect,
          voiceURI: settings.voiceURI,
          preferredDialect: settings.dialect,
          volume: settings.volume,
          rate: settings.rate,
        });
        if (token !== serial) return { status: 'cancelled' };
        if (result.status !== 'played') return result;
        try {
          await callbacks.onCompleted?.(segment.form);
        } catch (error) {
          if (token !== serial) return { status: 'cancelled' };
          throw error;
        }
      }
      return token === serial ? result : { status: 'cancelled' };
    },
    cancel() {
      serial++;
      service.cancel();
    },
  };
}
