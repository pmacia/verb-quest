import type { Dialect, FormKey } from '../../shared/domain/types';
import { Icon } from '../../shared/ui/Icon';

export interface EditorPreview {
  verbId: string;
  playingKey: string | null;
  play: (form: FormKey, value: string, dialect?: Dialect) => void;
}
export function EditorAudioPreview({
  audio,
  form,
  value,
  dialect,
  label,
}: {
  audio: EditorPreview;
  form: FormKey;
  value: string;
  dialect?: Dialect;
  label: string;
}) {
  const active = audio.playingKey === JSON.stringify([audio.verbId, form, value, dialect]);
  return (
    <button
      type="button"
      className="secondary ve-preview-button"
      disabled={!value.trim()}
      aria-label={active ? `Detener prueba: ${label.replace(/^Probar\s+/i, '')}` : label}
      title={active ? 'Detener prueba de audio' : label}
      aria-pressed={active}
      onClick={() => audio.play(form, value, dialect)}
    >
      <Icon name={active ? 'stop' : 'sound'} size={16} />
    </button>
  );
}
