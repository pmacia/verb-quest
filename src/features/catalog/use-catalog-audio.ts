import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../app/AppProviders';
import type { Verb } from '../../shared/domain/types';
import { systemClock } from '../../shared/time/clock';
import { createVerbAudioPlayer, getVerbAudioSegments } from '../audio/verb-audio';
import { getSpeechService } from '../audio/speech-service';
import { recordActivity } from '../gamification/awards';

export function useCatalogAudio(visibleIds: string[]) {
  const { settings, repos, profile } = useApp();
  const player = useMemo(() => createVerbAudioPlayer(getSpeechService()), []);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => () => player.cancel(), [player]);
  useEffect(() => {
    if (playingId && !visibleIds.includes(playingId)) {
      player.cancel();
      setPlayingId(null);
      setMessage('Audio detenido.');
    }
  }, [visibleIds, playingId, player]);
  async function play(verb: Verb) {
    player.cancel();
    if (playingId === verb.id) {
      setPlayingId(null);
      setMessage('Audio detenido.');
      return;
    }
    setPlayingId(verb.id);
    setMessage(`Reproduciendo las tres formas de ${verb.lemma}…`);
    try {
      const result = await player.play(getVerbAudioSegments(verb, settings.dialect), settings, {
        onCompleted: (form) =>
          recordActivity(repos, {
            kind: 'audio_completed',
            profileId: profile.id,
            verbId: verb.id,
            form,
            at: systemClock.now(),
          }),
      });
      if (result.status === 'cancelled') return;
      setPlayingId(null);
      setMessage(
        result.status === 'played'
          ? `Tres formas de ${verb.lemma} reproducidas. Voz sintética: ${result.voice?.name} · ${result.voice?.lang}${result.fallback ? ' · dialecto alternativo disponible' : ''}${verb.lemma === 'read' ? ' · ejemplos en contexto para distinguir la pronunciación' : ''}.`
          : 'Audio no disponible. Puedes volver a intentarlo o consultar las formas escritas.',
      );
    } catch (error) {
      setPlayingId(null);
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo completar el audio. Inténtalo de nuevo.',
      );
    }
  }
  return { playingId, message, play };
}
