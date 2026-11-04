import { useEffect, useState } from 'react';
import { useApp } from '../../app/app-context';
import { Icon } from '../../shared/ui/Icon';
import { updateSettings } from './settings-service';
export function ThemeToggle() {
  const { settings, repos, profile, refresh } = useApp();
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark);
  const label = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  return (
    <div className="quick-theme">
      <button
        type="button"
        className="icon-button"
        title={label}
        aria-label={label}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await updateSettings(repos, profile.id, { theme: dark ? 'light' : 'dark' });
            await refresh();
          } catch {
            setError('No se pudo guardar el tema. Inténtalo de nuevo.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <Icon name={dark ? 'sun' : 'moon'} size={20} />
      </button>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
