import type { Dataset, Verb } from '../../src/shared/domain/types';
import { validate } from '../../src/shared/domain/validation';
import { getCoverageTargets } from '../../src/features/question-engine/coverage';
export interface ContentReport {
  publishable: boolean;
  errors: { verbId?: string; message: string }[];
  warnings: string[];
  counts: { verbs: number; examples: number };
}
export function checkContent(dataset: Dataset, manifest: any): ContentReport {
  const errors: ContentReport['errors'] = [];
  const fail = (message: string, verbId?: string) => errors.push({ verbId, message });
  if (dataset.verbs.length < 100 || dataset.verbs.length > 150)
    fail('Se requieren entre 100 y 150 verbos.');
  const ids = new Set<string>();
  let examples = 0;
  for (const v of dataset.verbs) {
    if (ids.has(v.id)) fail('ID duplicado', v.id);
    ids.add(v.id);
    const checked = validate<Verb>('verb', v);
    if (!checked.ok) checked.issues.forEach((i) => fail(i.path + ': ' + i.message, v.id));
    if (
      v.editorialStatus !== 'validated' ||
      !manifest.entries?.[v.id] ||
      !v.sources.some((s) => s.url && s.checkedAt)
    )
      fail('Falta revisión/procedencia', v.id);
    for (const e of v.examples) {
      examples++;
      if (
        e.reviewStatus !== 'validated' ||
        !e.translation ||
        !e.source ||
        !e.sentence.toLowerCase().includes(e.targetForm.toLowerCase())
      )
        fail('Ejemplo incompleto o sin revisar', v.id);
    }
    for (const dialect of ['uk', 'us'] as const) {
      for (const t of getCoverageTargets(v, 'context', dialect)) {
        const found = v.examples.some(
          (e) =>
            e.form === t.form &&
            (!e.dialect || e.dialect === 'neutral' || e.dialect === dialect) &&
            (!t.contextKey || e.targetForm === t.variantValue),
        );
        if (!found) fail(`Falta ejemplo ${dialect}/${t.id}`, v.id);
      }
    }
  }
  const warnings = [
    'Revisión asistida; no hay certificación docente independiente.',
    'Solo la IPA contrastada está validada. El modo IPA estricto excluye propuestas pendientes; el modo normal puede usarlas para agrupaciones orientativas. Las voces del navegador no garantizan pronunciación por contexto.',
  ];
  return {
    publishable: errors.length === 0,
    errors,
    warnings,
    counts: { verbs: dataset.verbs.length, examples },
  };
}
