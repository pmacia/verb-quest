import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/app-context';
import {
  parseCatalogFile,
  exportCatalog,
  type ImportPreview,
  type ColumnMapping,
} from './transfer/parse';
import { previewImport } from './transfer/preview';
import { applyImport, type ImportDecision } from './transfer/apply';
import { downloadFile } from '../../shared/files/download';
import { Dialog } from '../../shared/ui/Dialog';
import { Icon } from '../../shared/ui/Icon';
import { BackupTransferPanel } from './BackupTransferPanel';
import { ReleaseExportPanel } from './ReleaseExportPanel';
import './import-export.css';
export function ImportExportPage() {
  const { repos, verbs, lists, refresh } = useApp();
  const [file, setFile] = useState<{ text: string; format: 'json' | 'csv' } | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [decisions, setDecisions] = useState<ImportDecision[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState('all');
  async function parse(text: string, format: 'json' | 'csv', map: ColumnMapping = {}) {
    setPreview(await previewImport(repos, parseCatalogFile(text, format, map)));
    setDecisions([]);
  }
  async function upload(f: File | undefined) {
    if (!f) return;
    setError('');
    setMessage('');
    setPreview(null);
    setFile(null);
    if (f.size > 5 * 1024 * 1024) {
      setError('Máximo 5 MiB para catálogo.');
      return;
    }
    setBusy(true);
    try {
      const text = await f.text();
      const format = f.name.toLowerCase().endsWith('.csv') ? 'csv' : 'json';
      setFile({ text, format });
      setMapping({});
      await parse(text, format);
    } finally {
      setBusy(false);
    }
  }
  const selected =
    scope === 'all'
      ? verbs
      : verbs.filter((v) => lists.find((l) => l.id === scope)?.verbIds.includes(v.id));
  return (
    <div className="transfer-page">
      <Link className="back-link" to="/verbs">
        <Icon name="arrow" size={15} /> Biblioteca
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TUS DATOS, CONTIGO</span>
          <h1>
            Importar y exportar<span className="dot">.</span>
          </h1>
          <p>Revisa cada cambio antes de guardarlo. Nunca sobrescribimos sin tu decisión.</p>
        </div>
      </div>
      <nav className="transfer-navigation" aria-label="Opciones de transferencia">
        <a href="#intercambiar-catalogo">
          <Icon name="book" size={16} />
          Catálogo
        </a>
        <a href="#copia-seguridad">
          <Icon name="save" size={16} />
          Copia completa
        </a>
        <a href="#publicar-base">
          <Icon name="upload" size={16} />
          Publicar base
        </a>
      </nav>
      <div className="detail-columns transfer-columns" id="intercambiar-catalogo">
        <section className="panel">
          <h2>
            <Icon name="upload" />
            Importar catálogo
          </h2>
          <p>Archivos CSV o JSON, hasta 5 MiB y 10.000 filas.</p>
          <label>
            Archivo del catálogo
            <input
              disabled={busy}
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                const input = e.target;
                void upload(input.files?.[0])
                  .catch((e) => setError(String(e)))
                  .finally(() => {
                    input.value = '';
                  });
              }}
            />
          </label>
          {preview?.columns && (
            <details>
              <summary>Mapear columnas CSV</summary>
              <div className="form-grid">
                {[
                  'id',
                  'base',
                  'past_simple',
                  'past_participle',
                  'meanings_es',
                  'recommended_courses',
                  'notes',
                ].map((target) => (
                  <label key={target}>
                    {target}
                    <select
                      value={mapping[target] ?? target}
                      onChange={(e) => setMapping({ ...mapping, [target]: e.target.value })}
                    >
                      {[...new Set([target, ...preview.columns!])].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <button
                className="secondary"
                onClick={() => file && void parse(file.text, file.format, mapping)}
              >
                Volver a previsualizar
              </button>
            </details>
          )}
          {preview && (
            <div className="transfer-preview">
              <h3 className="section-heading">
                Vista previa · {preview.rows.length} entradas válidas
              </h3>
              {preview.issues.length > 0 && (
                <div role="alert">
                  <strong>{preview.issues.length} errores por corregir</strong>
                  <ul>
                    {preview.issues.slice(0, 30).map((i, n) => (
                      <li key={n}>
                        Fila {i.row ?? '—'} · {i.path}: {i.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="transfer-preview-rows">
                {preview.rows.slice(0, 100).map((row) => (
                  <div className="skill-row" key={row.row}>
                    <strong>{row.verb.lemma}</strong>
                    <span>{row.verb.meanings.join(' / ')}</span>
                  </div>
                ))}
              </div>
              {preview.conflicts.map((c) => (
                <div className="notice" key={c.row}>
                  <strong>
                    Fila {c.row}: {c.reason} ({c.existingId})
                  </strong>
                  <label>
                    Decisión para fila {c.row}
                    <select
                      value={decisions.find((d) => d.row === c.row)?.choice ?? ''}
                      onChange={(e) =>
                        setDecisions([
                          ...decisions.filter((d) => d.row !== c.row),
                          {
                            row: c.row,
                            choice: e.target.value as ImportDecision['choice'],
                            expectedVersion: verbs.find((v) => v.id === c.existingId)
                              ?.contentVersion,
                          },
                        ])
                      }
                    >
                      <option value="">Selecciona una decisión</option>
                      <option value="skip">Omitir</option>
                      <option value="update">Actualizar existente</option>
                      <option value="create">Crear con otro ID</option>
                    </select>
                  </label>
                  {decisions.find((d) => d.row === c.row)?.choice === 'create' && (
                    <label>
                      Nuevo ID
                      <input
                        onChange={(e) =>
                          setDecisions(
                            decisions.map((d) =>
                              d.row === c.row ? { ...d, newId: e.target.value } : d,
                            ),
                          )
                        }
                      />
                    </label>
                  )}
                </div>
              ))}
              <button
                disabled={
                  busy ||
                  !preview.rows.length ||
                  !!preview.issues.length ||
                  preview.conflicts.some((c) => !decisions.some((d) => d.row === c.row))
                }
                onClick={() => setConfirm(true)}
              >
                Revisar importación
              </button>
            </div>
          )}
        </section>
        <aside>
          <section className="panel">
            <h2>
              <Icon name="book" />
              Exportar catálogo o lista
            </h2>
            <label>
              Selección
              <select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="all">Catálogo completo ({verbs.length})</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="transfer-selection-count">
              {selected.length} verbos · {selected.filter((v) => !!v.archivedAt).length} archivados
            </div>
            <p className="small">
              JSON conserva todos los campos, incluidos iconos, traducciones y pronunciación. CSV es
              simplificado: omite estos campos, ejemplos, audio y fuentes.
            </p>
            <div className="actions">
              {(['json', 'csv'] as const).map((f) => (
                <button
                  className="secondary"
                  key={f}
                  onClick={() =>
                    downloadFile(
                      `verbquest-catalogo.${f}`,
                      exportCatalog(selected, f),
                      f === 'csv' ? 'text/csv;charset=utf-8' : 'application/json',
                    )
                  }
                >
                  <Icon name="save" size={16} />
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </section>
          <BackupTransferPanel />
        </aside>
      </div>
      <ReleaseExportPanel />
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {confirm && preview && (
        <Dialog
          title="Confirmar importación"
          onClose={() => {
            if (!busy) setConfirm(false);
          }}
        >
          <p>
            Se procesarán {preview.rows.length} filas. Las decisiones de duplicados se aplicarán en
            una única operación.
          </p>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await applyImport(repos, preview, decisions);
                await refresh();
                setMessage(`${r.applied} entradas importadas; ${r.skipped} omitidas.`);
                setPreview(null);
                setConfirm(false);
              } catch (e) {
                setError(String(e));
                setConfirm(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirmar y guardar
          </button>
        </Dialog>
      )}
    </div>
  );
}
