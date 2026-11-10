import { strToU8, zipSync } from 'fflate';
import type { Dataset, Verb } from '../../../shared/domain/types';
import { validate } from '../../../shared/domain/validation';
import { getVerbIcon } from '../verb-icons';
import { checkContent } from '../../../../scripts/lib/content-audit';
import { auditPronunciations, pronunciationReview } from '../../../content/pronunciation-review';
import manifest from '../../../content/review-manifest.json';
import { dataset as bundledDataset } from '../../../content/dataset';

export interface ReleaseOptions {
  version: string;
  currentVersion: string;
  exportedAt: string;
}
export function buildReleasePackage(verbs: Verb[], options: ReleaseOptions) {
  const version = options.version.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(version))
    throw Error(
      'Usa una versión de hasta 80 caracteres: letras, números, puntos, guiones o guiones bajos.',
    );
  if (version === options.currentVersion)
    throw Error('La versión debe ser distinta de la base actual.');
  if (!verbs.length) throw Error('El catálogo está vacío.');
  const ids = new Set<string>();
  for (const verb of verbs) {
    const checked = validate<Verb>('verb', verb);
    if (!checked.ok)
      throw Error(
        `${verb.id}: ${checked.issues.map((i) => `${i.path}: ${i.message}`).join(' · ')}`,
      );
    if (ids.has(verb.id)) throw Error(`Identificador duplicado: ${verb.id}`);
    ids.add(verb.id);
  }
  const release: Dataset = {
    version,
    kind: 'curated',
    verbs: verbs.map((verb) => ({ ...structuredClone(verb), icon: getVerbIcon(verb) })),
  };
  // A manifest entry for an ID does not prove that locally edited text was reviewed.
  function editorialSnapshot(verb: Verb): string {
    const {
      icon: _icon,
      archivedAt: _archive,
      contentVersion: _version,
      createdAt: _created,
      updatedAt: _updated,
      ...content
    } = verb;
    const stable = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(stable)
        : value && typeof value === 'object'
          ? Object.fromEntries(
              Object.entries(value)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, child]) => [key, stable(child)]),
            )
          : value;
    return JSON.stringify(stable(content));
  }
  const baseline = new Map(bundledDataset.verbs.map((verb) => [verb.id, editorialSnapshot(verb)]));
  const changedIds = release.verbs
    .filter((verb) => baseline.get(verb.id) !== editorialSnapshot(verb))
    .map((verb) => verb.id);
  const editorial = checkContent(release, manifest);
  for (const verbId of changedIds)
    editorial.errors.push({
      verbId,
      message:
        'Contenido nuevo o modificado respecto a la base distribuida: requiere revisión editorial.',
    });
  editorial.publishable = editorial.errors.length === 0;
  const ipa = auditPronunciations(release.verbs, pronunciationReview);
  const report = {
    format: 'verbquest-publication-report',
    exportedAt: options.exportedAt,
    previousVersion: options.currentVersion,
    version,
    structurallyValid: true,
    editorialReady: editorial.publishable && ipa.issues.length === 0,
    counts: { ...editorial.counts, archived: verbs.filter((v) => v.archivedAt).length },
    editorial,
    changedIds,
    ipa,
    notice:
      'La exportación conserva el contenido y sus estados; no certifica ni valida contenido nuevo. No incluye perfil, listas, planes ni progreso. Los textos y URL del catálogo son contenido compartido: revísalos antes de publicarlos.',
  };
  const instructions = `# Publicar el catálogo ${version}

Este paquete contiene TODO el catálogo local, incluidos los verbos archivados, los iconos visibles, traducciones por forma, variantes, ejemplos, fuentes y pronunciación. No contiene las tablas personales del navegador. Revisa los textos y URL que hayas escrito en los propios verbos antes de compartirlos.

## Incorporación al repositorio

1. Crea una rama o una copia de seguridad del código fuente.
2. Copia los dos archivos de src/content/ en las MISMAS rutas de tu proyecto, sustituyendo dataset.ts y, si existe, catalog.release.json.
3. El nuevo dataset.ts carga directamente el catálogo consolidado. No aplica de nuevo enriquecimiento, traducciones ni correcciones fonéticas de las capas antiguas. Esos archivos permanecen como referencias editoriales; no necesitas borrarlos.
4. Revisa PUBLICATION_REPORT.json. Si editorialReady es false, corrige las incidencias y actualiza la evidencia editorial correspondiente antes de publicar. Los textos nuevos o modificados respecto a la base se señalan siempre para revisión humana; documenta esa revisión en el repositorio. El informe usa review-manifest.json y enrichment-review.json del código con el que se generó el paquete: no inventa revisiones ni sustituye esos documentos.
5. Ejecuta npm ci, npm test, npm run content:check y npm run build. No ignores errores ni modifiques comprobaciones para ocultarlos. Las pruebas de contenido y los manifiestos deben reflejar cualquier ampliación editorial real del catálogo.
6. Revisa el cambio en el navegador. Después confirma los archivos en Git y despliega la aplicación según tu procedimiento habitual. Descargar este ZIP no publica nada automáticamente.

## Actualizaciones y versiones

La nueva versión es ${version}; la anterior era ${options.currentVersion}. Usa una versión única en cada publicación; no reutilices versiones ya distribuidas. Las instalaciones nuevas cargarán esta base. Las existentes la recibirán al cargar la nueva aplicación: las modificaciones locales se conservan y las diferencias con la base quedan pendientes de revisión. La exportación no fuerza su sobrescritura.

Para retirar un verbo existente, archívalo e inclúyelo. Omitir un ID NO borra el verbo de instalaciones anteriores y puede romper referencias si después se intenta borrar manualmente. El paquete conserva el catálogo completo, aunque en la pantalla de intercambio se haya seleccionado una lista.

## Campos y archivos

- src/content/catalog.release.json: catálogo consolidado y versión, reutilizable también como importación JSON local.
- src/content/dataset.ts: punto de carga único, sin capas que sobrescriban el contenido.
- PUBLICATION_REPORT.json: validación estructural, incidencias editoriales y comprobaciones IPA contra la evidencia disponible. Un estado validado guardado por el editor no sustituye la revisión de fuentes.
- README-PUBLICAR.md: estas instrucciones.

Las URL de audio se conservan como referencias; no se descargan ni se incluyen grabaciones externas. Comprueba permisos, disponibilidad y licencias de los recursos que quieras distribuir.
`;
  const files = {
    'src/content/catalog.release.json': strToU8(JSON.stringify(release, null, 2) + '\n'),
    'src/content/dataset.ts': strToU8(
      "import release from './catalog.release.json';\nimport type { Dataset } from '../shared/domain/types';\n\n// Consolidated release: do not reapply historical enrichment layers.\nexport const dataset: Dataset = release as Dataset;\n",
    ),
    'PUBLICATION_REPORT.json': strToU8(JSON.stringify(report, null, 2) + '\n'),
    'README-PUBLICAR.md': strToU8(instructions),
  };
  return { bytes: zipSync(files, { level: 6 }), report, filename: `verbquest-base-${version}.zip` };
}
