import type { Verb, Dialect, FormKey, AppSettings } from '../../shared/domain/types';
import type { SpeechService, SpeechResult } from './speech-service';
export interface VerbAudioSegment {
  form: FormKey;
  text: string;
}
export type VerbAudioSettings = Pick<AppSettings, 'voiceURI' | 'dialect' | 'volume' | 'rate'>;
export function needsAudioContext(verb: Verb): boolean {
  return verb.forms.base.value.trim().toLowerCase() === 'read';
}
export function getVerbAudioSegment(verb: Verb, dialect: Dialect, form: FormKey): VerbAudioSegment {
  if (needsAudioContext(verb)) {
    const example = verb.examples.find(
      (e) =>
        e.form === form &&
        e.reviewStatus === 'validated' &&
        e.sentence.trim() &&
        (!e.dialect || e.dialect === 'neutral' || e.dialect === dialect),
    );
    if (!example)
      throw Error(
        'Para escuchar esta forma de read hace falta un ejemplo revisado. Puedes completarlo en su ficha.',
      );
    return { form, text: example.sentence };
  }
  return {
    form,
    text:
      form === 'base'
        ? verb.forms.base.value
        : [...new Set(verb.forms[form].variants.map((v) => v.value))].join(', '),
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
