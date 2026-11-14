import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../app/app-context';
import { getSpeechService } from './speech-service';
import { Icon } from '../../shared/ui/Icon';
import './audio-controls.css';
export function AudioControls({
  text,
  label,
  onPlayed,
  iconOnly = false,
  autoPlay = false,
  language = 'en',
  dialect,
  forceDialect = false,
}: {
  text: string;
  label: string;
  onPlayed?: () => void;
  iconOnly?: boolean;
  autoPlay?: boolean;
  language?: 'en' | 'es';
  dialect?: 'uk' | 'us';
  forceDialect?: boolean;
}) {
  const { settings } = useApp();
  const service = getSpeechService();
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState(false);
  const currentRequest = useRef(0);
  const compactSuccess = iconOnly && completed && !settings.showTechnicalDetails;
  useEffect(
    () => () => {
      currentRequest.current++;
      service.cancel();
    },
    [service, text, language],
  );
  async function play() {
    const request = ++currentRequest.current;
    setPlaying(true);
    setMessage('');
    setCompleted(false);
    setPaused(false);
    const r = await service.play({
      text,
      voiceURI: settings.voiceURI,
      preferredDialect: dialect ?? settings.dialect,
      language,
      forceDialect,
      volume: settings.volume,
      rate: settings.rate,
    });
    if (request !== currentRequest.current) return;
    setPlaying(false);
    if (r.status === 'played') {
      setCompleted(true);
      setMessage(
        settings.showTechnicalDetails
          ? `Voz sintética: ${r.voice?.name} · ${r.voice?.lang}${r.fallback ? ' · dialecto alternativo disponible' : ''}${r.voice?.localService ? ' · local' : ' · puede necesitar conexión'}`
          : `Audio reproducido.${r.fallback ? ' Se ha usado una voz de otro dialecto.' : ''}`,
      );
      onPlayed?.();
    } else if (r.status !== 'cancelled')
      setMessage('Audio no disponible. Puedes continuar con la alternativa visual.');
  }
  // Start once when this text is revealed, rather than when unrelated settings rerender.
  useEffect(() => {
    if (autoPlay && text.trim()) void play();
  }, [autoPlay, text, language]);
  return (
    <div className={`audio-controls${iconOnly ? ' audio-controls-compact' : ''}`}>
      <button
        type="button"
        className={iconOnly ? 'secondary icon-button' : 'secondary'}
        title={label}
        aria-busy={playing}
        disabled={playing || !text.trim()}
        aria-label={label}
        onClick={() => void play()}
      >
        <Icon name="sound" size={18} />
        {!iconOnly && (playing ? 'Reproduciendo…' : 'Escuchar')}
      </button>
      {playing && (
        <>
          <button
            type="button"
            className={iconOnly ? 'secondary icon-button' : 'secondary'}
            aria-label={paused ? 'Continuar audio' : 'Pausar audio'}
            title={paused ? 'Continuar audio' : 'Pausar audio'}
            onClick={() => {
              paused ? service.resume() : service.pause();
              setPaused(!paused);
            }}
          >
            {iconOnly ? (
              <Icon name={paused ? 'play' : 'pause'} size={18} />
            ) : paused ? (
              'Continuar audio'
            ) : (
              'Pausar audio'
            )}
          </button>
          <button
            type="button"
            className={iconOnly ? 'secondary icon-button' : 'secondary'}
            aria-label="Detener audio"
            title="Detener audio"
            onClick={() => {
              currentRequest.current++;
              service.cancel();
              setPlaying(false);
            }}
          >
            {iconOnly ? <Icon name="stop" size={18} /> : 'Detener audio'}
          </button>
        </>
      )}
      <small
        role="status"
        className={compactSuccess ? 'audio-played' : undefined}
        title={compactSuccess ? message : undefined}
      >
        {compactSuccess ? (
          <>
            <Icon name="check" size={17} />
            <span className="sr-only">{message}</span>
          </>
        ) : (
          message
        )}
      </small>
    </div>
  );
}
