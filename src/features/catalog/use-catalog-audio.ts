import { formValues } from './query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../app/app-context';
import type { Verb, FormKey, Dialect } from '../../shared/domain/types';
import { systemClock } from '../../shared/time/clock';
import {
  createVerbAudioPlayer,
  getVerbAudioSegments,
  getVerbAudioSegment,
  getVariantAudioSegment,
} from '../audio/verb-audio';
import { getSpeechService } from '../audio/speech-service';
import { recordActivity } from '../gamification/awards';

/** One player owns sequential and individual actions, including cancellation across them. */
export function useCatalogAudio(visibleIds: string[]) {
  const { settings, repos, profile } = useApp();
  const player = useMemo(() => createVerbAudioPlayer(getSpeechService()), []);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const currentKey = useRef<string | null>(null);
  const requestNumber = useRef(0);
  const [message, setMessage] = useState('');
  function stop() {
    requestNumber.current++;
    currentKey.current = null;
    player.cancel();
    setPlayingId(null);
    setPlayingKey(null);
  }
  useEffect(() => () => player.cancel(), [player]);
  useEffect(() => {
    if (playingId && !visibleIds.includes(playingId)) {
      stop();
      setMessage('Audio detenido.');
    }
  }, [visibleIds, playingId, player]);
  async function play(verb: Verb, form?: FormKey, value?: string, dialect?: Dialect) {
    const key = JSON.stringify([verb.id, form, value, dialect]);
    if (currentKey.current === key) {
      stop();
      setMessage('Audio detenido.');
      return;
    }
    player.cancel();
    const request = ++requestNumber.current;
    currentKey.current = key;
    setPlayingId(verb.id);
    setPlayingKey(form ? key : verb.id);
    setMessage(
      form
        ? `Reproduciendo ${value ?? formValues(verb, form).join(', ')}…`
        : `Reproduciendo las tres formas de ${verb.lemma}…`,
    );
    try {
      const segments = form
        ? [
            value !== undefined
              ? getVariantAudioSegment(verb, form, value)
              : getVerbAudioSegment(verb, dialect ?? settings.dialect, form),
          ]
        : getVerbAudioSegments(verb, settings.dialect);
      const result = await player.play(
        segments,
        { ...settings, dialect: dialect ?? settings.dialect, forceDialect: !!dialect },
        {
          onCompleted: (completedForm) =>
            recordActivity(repos, {
              kind: 'audio_completed',
              profileId: profile.id,
              verbId: verb.id,
              form: completedForm,
              at: systemClock.now(),
            }),
        },
      );
      if (requestNumber.current !== request) return;
      currentKey.current = null;
      setPlayingId(null);
      setPlayingKey(null);
      if (result.status === 'cancelled') {
        setMessage('Audio detenido.');
        return;
      }
      const success = form ? 'Audio reproducido.' : `Tres formas de ${verb.lemma} reproducidas.`;
      setMessage(
        result.status === 'played'
          ? `${success}${settings.showTechnicalDetails ? ` Voz sintética: ${result.voice?.name} · ${result.voice?.lang}${result.voice?.localService ? ' · local' : ' · puede necesitar conexión'}.` : ''}${result.fallback ? ' Se ha usado una voz de otro dialecto.' : ''}`
          : 'Audio no disponible. Puedes volver a intentarlo o consultar las formas escritas.',
      );
    } catch (error) {
      if (requestNumber.current !== request) return;
      stop();
      setMessage(error instanceof Error ? error.message : 'No se pudo completar el audio.');
    }
  }
  return { playingId, playingKey, message, play };
}
