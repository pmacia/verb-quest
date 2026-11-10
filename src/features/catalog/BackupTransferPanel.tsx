import { useState } from 'react';
import { useApp } from '../../app/app-context';
import { exportBackup, previewRestore, restoreBackup } from '../persistence/backup';
import { downloadFile } from '../../shared/files/download';
import { systemClock } from '../../shared/time/clock';
import { Dialog } from '../../shared/ui/Dialog';
import { Icon } from '../../shared/ui/Icon';
import type { BackupV1 } from '../../shared/domain/types';
export function BackupTransferPanel() {
  const { repos, profile } = useApp();
  const [backup, setBackup] = useState<BackupV1 | null>(null);
  const [restoreStep, setRestoreStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function downloadCurrent(name: string) {
    setError('');
    setBusy(true);
    try {
      const backup = await exportBackup(repos, profile.id, systemClock);
      downloadFile(name, JSON.stringify(backup, null, 2));
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel transfer-backup" id="copia-seguridad">
        <h2>
          <Icon name="save" />
          Copia de seguridad
        </h2>
        <p>
          Incluye perfil, progreso, listas, planes, ajustes y catálogo local. Guárdala fuera del
          navegador.
        </p>
        <button
          disabled={busy}
          className="secondary"
          onClick={() => void downloadCurrent('verbquest-copia.json')}
        >
          <Icon name="save" size={16} />
          Descargar copia completa
        </button>
        <label className="transfer-restore-field">
          Restaurar copia JSON
          <input
            disabled={busy}
            type="file"
            accept=".json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setError('');
              setBackup(null);
              setRestoreStep(0);
              setBusy(true);
              try {
                if (f.size > 25 * 1024 * 1024) throw Error('Máximo 25 MiB para copia.');
                const r = previewRestore(JSON.parse(await f.text()));
                if (!r.ok) throw Error(r.issues.map((i) => `${i.path}: ${i.message}`).join(' · '));
                setBackup(r.value);
                setRestoreStep(1);
              } catch (e) {
                setError(String(e));
              } finally {
                setBusy(false);
                e.target.value = '';
              }
            }}
          />
        </label>
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
      </section>
      {backup && restoreStep > 0 && (
        <Dialog
          title={restoreStep === 1 ? 'Revisar copia' : 'Reemplazar los datos locales'}
          onClose={() => {
            if (busy) return;
            setBackup(null);
            setRestoreStep(0);
          }}
        >
          <p>
            Perfil: {backup.profile.name}. {backup.verbs.length} verbos, {backup.attempts.length}{' '}
            intentos, {backup.lists.length} listas.
          </p>
          <p>Esto sustituirá todos los datos de este navegador. No se mezclan perfiles.</p>
          {restoreStep === 1 ? (
            <>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void downloadCurrent('verbquest-antes-restaurar.json')}
              >
                Descargar copia actual
              </button>
              <button disabled={busy} onClick={() => setRestoreStep(2)}>
                Continuar
              </button>
            </>
          ) : (
            <button
              className="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await restoreBackup(repos, backup, 'replace_local_profile');
                  window.location.href = '/';
                } catch (e) {
                  setError(String(e));
                  setBackup(null);
                  setRestoreStep(0);
                  setBusy(false);
                }
              }}
            >
              Confirmar reemplazo definitivo
            </button>
          )}
        </Dialog>
      )}
    </>
  );
}
