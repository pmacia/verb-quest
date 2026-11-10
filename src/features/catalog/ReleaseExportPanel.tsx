import { useEffect, useState } from 'react';
import { useApp } from '../../app/app-context';
import { dataset } from '../../content/dataset';
import { Icon } from '../../shared/ui/Icon';
import { downloadBlob } from '../../shared/files/download';
import type { buildReleasePackage } from './transfer/release-package';
type Release = ReturnType<typeof buildReleasePackage>;

export function ReleaseExportPanel() {
  const { verbs, repos } = useApp();
  const [baseVersion, setBaseVersion] = useState(dataset.version);
  const [version, setVersion] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Release['report'] | null>(null);
  useEffect(() => {
    let active = true;
    void repos.meta
      .get('datasetVersion')
      .then((row) => {
        if (active && row?.value) setBaseVersion(row.value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [repos]);
  return (
    <details className="panel transfer-release" id="publicar-base">
      <summary className="transfer-release-summary">
        <span className="transfer-section-icon">
          <Icon name="upload" />
        </span>
        <span>
          <strong>Publicar catálogo base</strong>
          <small>Avanzado · archivos para el código fuente</small>
        </span>
        <span className="transfer-expand" aria-hidden="true">
          ⌄
        </span>
      </summary>
      <div className="transfer-release-body">
        <p>
          Prepara una nueva base para todos los usuarios. Descargar el paquete no modifica el código
          ni publica la aplicación.
        </p>
        <div className="transfer-scope">
          <Icon name="book" size={17} />
          <span>
            <strong>{verbs.length} verbos</strong> · {verbs.filter((v) => !!v.archivedAt).length}{' '}
            archivados · base actual <code>{baseVersion}</code>
          </span>
        </div>
        <p className="small muted">
          Siempre se exporta todo el catálogo local, aunque arriba hayas elegido una lista. Incluye
          los iconos visibles y todos los campos de los verbos; no incluye perfil, listas, planes ni
          progreso.
        </p>
        <form
          className="transfer-release-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setReport(null);
            setBusy(true);
            try {
              if (version.trim() === dataset.version)
                throw Error('Usa una versión distinta de la base distribuida con esta aplicación.');
              const { buildReleasePackage } = await import('./transfer/release-package');
              const result = buildReleasePackage(verbs, {
                version,
                currentVersion: baseVersion,
                exportedAt: new Date().toISOString(),
              });
              setReport(result.report);
              downloadBlob(
                result.filename,
                new Blob([new Uint8Array(result.bytes)], { type: 'application/zip' }),
              );
            } catch (error) {
              setError(error instanceof Error ? error.message : String(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Nueva versión del catálogo
            <input
              required
              maxLength={80}
              value={version}
              placeholder="Ej.: school-2026.11"
              aria-describedby="release-version-help"
              onChange={(e) => {
                setVersion(e.target.value);
                setReport(null);
                setError('');
              }}
            />
          </label>
          <button disabled={busy || !version.trim()}>
            <Icon name="upload" size={17} />
            {busy ? 'Preparando paquete…' : 'Descargar catálogo base ZIP'}
          </button>
        </form>
        <p className="small muted" id="release-version-help">
          Usa una versión única, sin espacios, distinta de las ya publicadas. Se conserva la versión
          individual de cada registro.
        </p>
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        {report && (
          <div
            className={`transfer-report ${report.editorialReady ? 'is-ready' : 'needs-review'}`}
            role="status"
          >
            <Icon name={report.editorialReady ? 'check' : 'info'} size={19} />
            <div>
              <strong>
                {report.editorialReady
                  ? 'Paquete generado · sin incidencias automáticas detectadas'
                  : 'Paquete generado · revisión editorial pendiente'}
              </strong>
              <p>
                {report.counts.verbs} verbos · {report.counts.examples} ejemplos ·{' '}
                {report.editorial.errors.length} incidencias editoriales ·{' '}
                {report.ipa.issues.length} incidencias IPA.
              </p>
              <p>
                Consulta el informe y la guía dentro del ZIP antes de incorporarlo. Estas
                comprobaciones automáticas no sustituyen una revisión docente.
              </p>
            </div>
          </div>
        )}
        <div className="transfer-package-guide">
          <strong>Del navegador al código fuente</strong>
          <ol>
            <li>
              Revisa <code>PUBLICATION_REPORT.json</code> y corrige las incidencias pendientes.
            </li>
            <li>
              Copia los dos archivos de <code>src/content/</code> en el repositorio. El nuevo
              cargador usa el catálogo consolidado, sin sobrescrituras de las capas antiguas.
            </li>
            <li>
              Sigue <code>README-PUBLICAR.md</code>, ejecuta las comprobaciones y publica una nueva
              versión de la aplicación.
            </li>
          </ol>
        </div>
        <p className="small muted">
          Las modificaciones locales de otros usuarios seguirán protegidas. Para retirar un verbo,
          expórtalo archivado: omitirlo no lo elimina de instalaciones anteriores. Revisa también
          los textos y enlaces que hayas añadido a los verbos antes de compartirlos.
        </p>
      </div>
    </details>
  );
}
