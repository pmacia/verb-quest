import { useEffect, useState } from 'react';
import { useApp } from '../../app/app-context';
import { getSpeechService } from './speech-service';
import { Icon } from '../../shared/ui/Icon';
export function AudioControls({
  text,
  label,
  onPlayed,
}: {
  text: string;
  label: string;
  onPlayed?: () => void;
}) {
  const { settings } = useApp();
  const service = getSpeechService();
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => () => service.cancel(), [text]);
  return (
    <div className="audio-controls">
      <button
        type="button"
        className="secondary"
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
              `Voz sintética: ${r.voice?.name} · ${r.voice?.lang}${r.fallback ? ' · dialecto alternativo disponible' : ''}${r.voice?.localService ? ' · local' : ' · puede necesitar conexión'}`,
            );
            onPlayed?.();
          } else if (r.status !== 'cancelled')
            setMessage('Audio no disponible. Puedes continuar con la alternativa visual.');
        }}
      >
        <Icon name="sound" size={18} />
        {playing ? 'Reproduciendo…' : 'Escuchar'}
      </button>
      {playing && (
        <>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              paused ? service.resume() : service.pause();
              setPaused(!paused);
            }}
          >
            {paused ? 'Continuar audio' : 'Pausar audio'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              service.cancel();
              setPlaying(false);
            }}
          >
            Detener audio
          </button>
        </>
      )}
      <small role="status">{message}</small>
    </div>
  );
}
