import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppProviders';
import { getSpeechService, type VoiceInfo } from '../audio/speech-service';
import { updateSettings, resetProgress, deleteAllLocalData } from './settings-service';
import { exportBackup } from '../persistence/backup';
import { downloadFile } from '../../shared/files/download';
import { systemClock } from '../../shared/time/clock';
import { Dialog } from '../../shared/ui/Dialog';
import type { AppSettings } from '../../shared/domain/types';
export function SettingsPage() {
  const { repos, profile, settings, refresh } = useApp();
  const [s, setS] = useState(settings);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{ kind: 'progress' | 'all'; step: number } | null>(null);
  useEffect(() => {
    const service = getSpeechService();
    setVoices(service.listVoices());
    return service.subscribeVoices(() => setVoices(service.listVoices()));
  }, []);
  function change(patch: Partial<AppSettings>) {
    setS({ ...s, ...patch });
    setMessage('');
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">QUE LA EXPERIENCIA SE PAREZCA A TI</span>
          <h1>
            A tu manera<span className="dot">.</span>
          </h1>
          <p>Ajustes de este navegador. Sin cuentas, anuncios ni clasificaciones públicas.</p>
        </div>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await updateSettings(repos, profile.id, s);
            await refresh();
            setMessage('Preferencias guardadas.');
            setError('');
          } catch (e) {
            setError(String(e));
          }
        }}
      >
        <section className="panel settings-section">
          <h2>Tu ritmo y tu espacio</h2>
          <div className="form-grid">
            <label>
              Duración de sesión
              <select
                aria-label="Duración de sesión"
                value={s.minutes}
                onChange={(e) => change({ minutes: Number(e.target.value) as 5 | 10 | 15 })}
              >
                {[5, 10, 15].map((n) => (
                  <option value={n} key={n}>
                    {n} minutos
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tema
              <select
                aria-label="Tema"
                value={s.theme}
                onChange={(e) => change({ theme: e.target.value as AppSettings['theme'] })}
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="system">Según el dispositivo</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={s.reducedMotion}
                onChange={(e) => change({ reducedMotion: e.target.checked })}
              />
              Reducir movimiento
            </label>
            <label>
              <input
                type="checkbox"
                checked={s.sounds}
                onChange={(e) => change({ sounds: e.target.checked })}
              />
              Sonidos de la experiencia
            </label>
            <label>
              Zona de calendario
              <input value={s.timeZone} onChange={(e) => change({ timeZone: e.target.value })} />
              <small>
                Ejemplo: Europe/Madrid. Cambiarla no reescribe las fechas de intentos anteriores.
              </small>
            </label>
          </div>
        </section>
        <section className="panel settings-section">
          <h2>Escuchar a tu ritmo</h2>
          <div className="form-grid">
            <label>
              Dialecto preferido
              <select
                aria-label="Dialecto preferido"
                value={s.dialect}
                onChange={(e) => change({ dialect: e.target.value as 'uk' | 'us', voiceURI: null })}
              >
                <option value="uk">Británico</option>
                <option value="us">Americano</option>
              </select>
            </label>
            <label>
              Voz sintética
              <select
                aria-label="Voz sintética"
                value={s.voiceURI ?? ''}
                onChange={(e) => change({ voiceURI: e.target.value || null })}
              >
                <option value="">Automática según dialecto</option>
                {voices.map((v) => (
                  <option value={v.uri} key={v.uri}>
                    {v.name} · {v.lang} · {v.localService ? 'local' : 'puede necesitar red'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Volumen · {Math.round(s.volume * 100)} %
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={s.volume}
                onChange={(e) => change({ volume: Number(e.target.value) })}
              />
            </label>
            <label>
              Velocidad · {s.rate.toFixed(1)}×
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={s.rate}
                onChange={(e) => change({ rate: Number(e.target.value) })}
              />
            </label>
          </div>
          <p className="small">
            La disponibilidad y la pronunciación dependen de la voz instalada. Algunas voces pueden
            enviar el texto a su proveedor; no se garantiza audio offline. Si no hay voz, tendrás
            una actividad visual.
          </p>
        </section>
        <section className="panel settings-section">
          <h2>Repaso y recordatorios</h2>
          <p>Recordatorios desactivados en esta versión. No pedimos permiso de notificaciones.</p>
          <details>
            <summary>Intervalos de repaso configurables</summary>
            <p className="small">
              Valores iniciales: 1, 3, 7 y 14 días. Cambiarlos afecta a los próximos avances, no a
              intentos pasados.
            </p>
            <div className="form-grid">
              {s.learning.intervalDays.map((n, i) => (
                <label key={i}>
                  Intervalo {i + 1} (días)
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={n}
                    onChange={(e) => {
                      const days = [...s.learning.intervalDays] as [number, number, number, number];
                      days[i] = Number(e.target.value);
                      change({ learning: { ...s.learning, intervalDays: days } });
                    }}
                  />
                </label>
              ))}
            </div>
          </details>
        </section>
        {error && <p role="alert">{error}</p>}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <div>
          <button>Guardar preferencias</button>
        </div>
      </form>
      <section className="panel settings-section" style={{ marginTop: 28 }}>
        <h2>Tus datos son tuyos</h2>
        <p>
          El progreso y el catálogo viven en IndexedDB en este navegador. Si borras sus datos o
          cambias de dispositivo, necesitarás una copia para recuperarlos.
        </p>
        <div className="actions">
          <button
            className="secondary"
            onClick={() =>
              void exportBackup(repos, profile.id, systemClock)
                .then((b) => downloadFile('verbquest-copia.json', JSON.stringify(b, null, 2)))
                .catch((e) => setError(String(e)))
            }
          >
            Exportar mis datos
          </button>
          <Link className="button secondary" to="/editor/import-export">
            Restaurar una copia
          </Link>
        </div>
      </section>
      <section className="panel danger-zone">
        <h2>Empezar de nuevo</h2>
        <p>
          Reiniciar progreso conserva catálogo, listas, planes y preferencias. Borrar todos los
          datos elimina también esos elementos.
        </p>
        <div className="actions">
          <button className="secondary" onClick={() => setConfirm({ kind: 'progress', step: 1 })}>
            Reiniciar progreso
          </button>
          <button className="danger" onClick={() => setConfirm({ kind: 'all', step: 1 })}>
            Borrar todos los datos locales
          </button>
        </div>
      </section>
      {confirm && (
        <Dialog
          title={confirm.step === 1 ? 'Revisar borrado' : 'Confirmación final'}
          onClose={() => setConfirm(null)}
        >
          <p>
            {confirm.kind === 'progress'
              ? 'Se borrarán intentos, sesiones, progreso, puntos y sellos. Tus listas y verbos se conservan.'
              : 'Se eliminará todo el contenido local, incluidas ediciones, listas y progreso.'}
          </p>
          {confirm.step === 1 ? (
            <>
              <button
                className="secondary"
                onClick={() =>
                  void exportBackup(repos, profile.id, systemClock).then((b) =>
                    downloadFile('verbquest-antes-borrar.json', JSON.stringify(b)),
                  )
                }
              >
                Descargar copia antes
              </button>
              <button className="danger" onClick={() => setConfirm({ ...confirm, step: 2 })}>
                Entiendo, continuar
              </button>
            </>
          ) : (
            <button
              className="danger"
              onClick={async () => {
                try {
                  if (confirm.kind === 'all') {
                    await deleteAllLocalData(repos);
                    window.location.href = '/';
                  } else {
                    await resetProgress(repos, profile.id);
                    await refresh();
                    setConfirm(null);
                    setMessage('Progreso reiniciado.');
                  }
                } catch (e) {
                  setError(String(e));
                  setConfirm(null);
                }
              }}
            >
              Confirmar borrado
            </button>
          )}
        </Dialog>
      )}
    </>
  );
}
