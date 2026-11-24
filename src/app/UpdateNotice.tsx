import { useEffect, useRef, useState } from 'react';
import { useApp } from './app-context';
import { prepareAppUpdate, registerAppUpdates } from './pwa';
import { completeSession } from '../features/learning-engine/session-service';
import { systemClock } from '../shared/time/clock';
import { Dialog } from '../shared/ui/Dialog';
import { Icon } from '../shared/ui/Icon';

export function UpdateNotice() {
  const { repos, refresh } = useApp();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);

  useEffect(() => registerAppUpdates(() => setReady(true)), []);

  const activeIds = () => repos.sessions.where('status').equals('active').primaryKeys();

  async function update(confirmedIds?: readonly string[]) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    let closed = 0;
    try {
      if (!confirmedIds) {
        const active = await activeIds();
        if (active.length) {
          setConfirm(active);
          return;
        }
      }

      const activate = await prepareAppUpdate();
      if (confirmedIds) {
        const result = await repos.runAtomic(async () => {
          const active = await activeIds();
          if (active.some((id) => !confirmedIds.includes(id))) return { active, closed: 0 };
          for (const id of active) await completeSession(repos, id, systemClock);
          return { active: [], closed: active.length };
        });
        if (result.active.length) {
          setConfirm(result.active);
          setError('La sesión activa ha cambiado. Confirma de nuevo para cerrarla.');
          return;
        }
        closed = result.closed;
        setConfirm(null);
        if (closed) await refresh();
      }

      const result = await repos.runAtomic(async () => {
        const active = await activeIds();
        if (active.length) return { active };
        // Send the request while session writers are excluded, then await it outside IndexedDB.
        const activation = activate().then(
          () => null,
          (error: unknown) => ({ error }),
        );
        return { activation };
      });
      if (result.active) {
        setConfirm(result.active);
        setError('Hay una sesión activa. Confirma su cierre para actualizar.');
        return;
      }

      const failure = await result.activation;
      if (failure) throw failure.error;
      setReady(false);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(
        closed ? `El progreso se ha guardado y el cierre se ha completado. ${message}` : message,
      );
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
          {busy
            ? 'Preparando actualización…'
            : error
              ? 'Reintentar actualización'
              : 'Actualizar aplicación'}
        </button>
        {error && !confirm && <p role="alert">{error}</p>}
      </div>
      {(confirm || busy) && (
        <Dialog
          title={confirm ? 'Cerrar sesión y actualizar' : 'Preparando actualización'}
          onClose={busy ? undefined : () => setConfirm(null)}
        >
          {confirm ? (
            <>
              <p>
                {confirm.length === 1
                  ? 'Tienes una sesión en marcha.'
                  : `Hay ${confirm.length} sesiones en marcha.`}{' '}
                El cierre es definitivo.
              </p>
              <p>
                Se conservarán las respuestas y el progreso guardados. Las preguntas pendientes
                quedarán sin responder.
              </p>
              {error && <p role="alert">{error}</p>}
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => setConfirm(null)}
                >
                  Seguir con mi sesión
                </button>
                <button type="button" disabled={busy} onClick={() => void update(confirm)}>
                  <Icon name="check" size={18} />{' '}
                  {busy ? 'Preparando actualización…' : 'Cerrar sesión y actualizar'}
                </button>
              </div>
            </>
          ) : (
            <p role="status">Estamos preparando la nueva versión de VerbQuest.</p>
          )}
        </Dialog>
      )}
    </>
  ) : null;
}
