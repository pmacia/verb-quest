import { useEffect, useState } from 'react';
import { useApp } from '../../app/app-context';
import { getSpeechService } from './speech-service';
import { Icon } from '../../shared/ui/Icon';
export function AudioControls({
  text,
  label,
  onPlayed,
  iconOnly = false,
}: {
  text: string;
  label: string;
  onPlayed?: () => void;
  iconOnly?: boolean;
}) {
  const { settings } = useApp();
  const service = getSpeechService();
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => () => service.cancel(), [text]);
  return (
    <div className={`audio-controls${iconOnly ? ' audio-controls-compact' : ''}`}>
      <button
        type="button"
        className={iconOnly ? 'secondary icon-button' : 'secondary'}
        title={label}
        aria-busy={playing}
        disabled={playing}
        aria-label={label}
        onClick={async () => {
          setPlaying(true);
          setMessage('');
          setPaused(false);
          const r = await service.play({
            text,
            voiceURI: settings.voiceURI,
            preferredDialect: settings.dialect,
            volume: settings.volume,
            rate: settings.rate,
          });
          setPlaying(false);
          if (r.status === 'played') {
            setMessage(
              settings.showTechnicalDetails
                ? `Voz sintética: ${r.voice?.name} · ${r.voice?.lang}${r.fallback ? ' · dialecto alternativo disponible' : ''}${r.voice?.localService ? ' · local' : ' · puede necesitar conexión'}`
                : `Audio reproducido.${r.fallback ? ' Se ha usado una voz de otro dialecto.' : ''}`,
            );
            onPlayed?.();
          } else if (r.status !== 'cancelled')
            setMessage('Audio no disponible. Puedes continuar con la alternativa visual.');
        }}
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
              service.cancel();
              setPlaying(false);
            }}
          >
            {iconOnly ? <Icon name="stop" size={18} /> : 'Detener audio'}
          </button>
        </>
      )}
      <small role="status">{message}</small>
    </div>
  );
}
