import { useEffect, useRef, useState } from 'react';
import { useApp } from './app-context';
import { registerAppUpdates, activateUpdate, ActiveSessionUpdateError } from './pwa';
import { completeSession } from '../features/learning-engine/session-service';
import { systemClock } from '../shared/time/clock';
import { Dialog } from '../shared/ui/Dialog';
import { Icon } from '../shared/ui/Icon';

export function UpdateNotice() {
  const { repos, refresh } = useApp();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  useEffect(
    () =>
      registerAppUpdates({
        hasActiveSession: async () =>
          !!(await repos.sessions.where('status').equals('active').first()),
        onUpdateReady: () => setReady(true),
      }),
    [repos],
  );
  async function update(closeSession = false) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      if (closeSession) {
        const sessions = await repos.sessions.where('status').equals('active').toArray();
        for (const session of sessions) await completeSession(repos, session.id, systemClock);
        await refresh();
      }
      await activateUpdate();
      setConfirm(false);
    } catch (e) {
      if (e instanceof ActiveSessionUpdateError) setConfirm(true);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  return ready ? (
    <>
      <div className="update-notice" role="status">
        <strong>Hay una nueva versión disponible</strong>
        <p>
          Tu progreso se conserva. Si tienes una sesión en marcha, podrás cerrarla antes de
          actualizar.
        </p>
        <button disabled={busy} onClick={() => void update()}>
          {busy ? 'Preparando actualización…' : 'Actualizar aplicación'}
        </button>
        {error && !confirm && <p role="alert">{error}</p>}
      </div>
      {confirm && (
        <Dialog
          title="Cerrar sesión y actualizar"
          onClose={() => {
            if (!working.current) setConfirm(false);
          }}
        >
          <p>Tienes una sesión en marcha. Puedes cerrarla aquí y continuar con la actualización.</p>
          <p>
            Las respuestas y el progreso guardados se conservarán. Las preguntas pendientes quedarán
            sin responder.
          </p>
          {error && <p role="alert">{error}</p>}
          <div className="actions">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Seguir con mi sesión
            </button>
            <button type="button" disabled={busy} onClick={() => void update(true)}>
              <Icon name="check" size={18} />{' '}
              {busy ? 'Preparando actualización…' : 'Cerrar sesión y actualizar'}
            </button>
          </div>
        </Dialog>
      )}
    </>
  ) : null;
}
