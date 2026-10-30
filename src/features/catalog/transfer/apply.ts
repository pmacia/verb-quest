import type { AppRepositories } from '../../persistence/repositories';
import type { ImportPreview } from './parse';
import { validate } from '../../../shared/domain/validation';
import type { Verb } from '../../../shared/domain/types';
export interface ImportDecision {
  row: number;
  choice: 'skip' | 'update' | 'create';
  newId?: string;
  expectedVersion?: string;
}
export async function applyImport(
  repos: AppRepositories,
  preview: ImportPreview,
  decisions: ImportDecision[],
) {
  if (preview.issues.length) throw Error('Corrige los errores antes de importar.');
  return repos.runAtomic(async () => {
    let applied = 0,
      skipped = 0;
    for (const r of preview.rows) {
      const conflict = preview.conflicts.find((c) => c.row === r.row);
      const decision = decisions.find((d) => d.row === r.row);
      if (conflict && !decision) throw Error('Elige cómo resolver cada duplicado.');
      if (decision?.choice === 'skip') {
        skipped++;
        continue;
      }
      const id =
        conflict && decision?.choice === 'update'
          ? conflict.existingId
          : (decision?.newId ?? r.verb.id);
      const current = await repos.catalog.get(id);
      if (current && decision?.choice !== 'update')
        throw Error('El catálogo ha cambiado; vuelve a previsualizar.');
      if (decision?.expectedVersion && current?.verb.contentVersion !== decision.expectedVersion)
        throw Error('Conflicto de versión; vuelve a previsualizar.');
      if (
        conflict &&
        decision?.choice === 'create' &&
        (!decision.newId || decision.newId === conflict.existingId)
      )
        throw Error('Crear requiere un identificador nuevo.');
      const v = validate<Verb>('verb', { ...r.verb, id, contentVersion: crypto.randomUUID() });
      if (!v.ok) throw Error('Datos no válidos al confirmar.');
      await repos.catalog.put({
        verb: v.value,
        baseVersion: current?.baseVersion ?? null,
        locallyModified: true,
        pendingBase: current?.pendingBase ?? null,
      });
      applied++;
    }
    return { applied, skipped };
  });
}
