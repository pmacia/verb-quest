import { useEffect, useState } from 'react';
import { useApp } from './AppProviders';
import { registerAppUpdates, activateUpdate } from './pwa';
export function UpdateNotice() {
  const { repos } = useApp();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(
    () =>
      registerAppUpdates({
        hasActiveSession: async () =>
          !!(await repos.sessions.where('status').equals('active').first()),
        onUpdateReady: () => setReady(true),
      }),
    [],
  );
  return ready ? (
    <div className="update-notice" role="status">
      <strong>Hay una nueva versión disponible</strong>
      <p>Tu progreso se conserva. Pausa o termina la sesión antes de actualizar.</p>
      <button onClick={() => void activateUpdate().catch((e) => setError(String(e)))}>
        Actualizar aplicación
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  ) : null;
}
