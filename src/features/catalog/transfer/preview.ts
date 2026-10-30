import type { AppRepositories } from '../../persistence/repositories';
import type { ImportPreview } from './parse';
import { normalize } from '../query';
export async function previewImport(
  repos: AppRepositories,
  parsed: ImportPreview,
): Promise<ImportPreview> {
  const existing = await repos.catalog.toArray();
  return {
    ...parsed,
    conflicts: parsed.rows.flatMap((r) => {
      const found =
        existing.find((e) => e.verb.id === r.verb.id) ||
        existing.find((e) => normalize(e.verb.lemma) === normalize(r.verb.lemma));
      return found
        ? [
            {
              row: r.row,
              existingId: found.verb.id,
              reason:
                found.verb.id === r.verb.id
                  ? 'Identificador existente'
                  : 'Infinitivo duplicado probable',
            },
          ]
        : [];
    }),
  };
}
