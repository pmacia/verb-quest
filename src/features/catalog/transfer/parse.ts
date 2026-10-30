import Papa from 'papaparse';
import type { Verb, ValidationIssue } from '../../../shared/domain/types';
import { adaptLegacyVerb, validate } from '../../../shared/domain/validation';
export type ColumnMapping = Record<string, string>;
export interface ImportRow {
  row: number;
  verb: Verb;
}
export interface ImportIssue extends ValidationIssue {
  row?: number;
}
export interface ImportConflict {
  row: number;
  existingId: string;
  reason: string;
}
export interface ImportPreview {
  rows: ImportRow[];
  issues: ImportIssue[];
  conflicts: ImportConflict[];
  columns?: string[];
}
const split = (v: string | undefined, sep = ';') =>
  (v ?? '')
    .split(sep)
    .map((x) => x.trim())
    .filter(Boolean);
export function parseCatalogFile(
  text: string,
  format: 'csv' | 'json',
  mapping: ColumnMapping = {},
): ImportPreview {
  const out: ImportPreview = { rows: [], issues: [], conflicts: [] };
  if (new TextEncoder().encode(text).length > 5 * 1024 * 1024)
    return { ...out, issues: [{ path: '', code: 'size', message: 'El archivo supera 5 MiB.' }] };
  try {
    let input: { value: unknown; row: number }[];
    if (format === 'json') {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : parsed.verbs;
      if (!Array.isArray(arr)) throw Error('JSON debe contener una lista de verbos.');
      input = arr.map((value, row) => ({ value, row: row + 1 }));
    } else {
      const p = Papa.parse<Record<string, string>>(text.replace(/^\ufeff/, ''), {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) => h.trim(),
      });
      out.columns = p.meta.fields ?? [];
      out.issues.push(
        ...p.errors.map((e) => ({
          path: '',
          code: e.code,
          message: e.message,
          row: (e.row ?? 0) + 2,
        })),
      );
      input = p.data.map((raw, i) => {
        const row = { ...raw };
        for (const [target, source] of Object.entries(mapping)) row[target] = raw[source];
        const base = row.base ?? row.lemma ?? '';
        const past = split(row.past_simple, '/');
        const pp = split(row.past_participle, '/');
        return {
          row: i + 2,
          value: {
            id: row.id || base,
            lemma: base,
            forms: {
              base: { value: base },
              pastSimple: { variants: past.map((value) => ({ value, dialect: 'all' })) },
              pastParticiple: { variants: pp.map((value) => ({ value, dialect: 'all' })) },
            },
            meanings: split(row.meanings_es),
            classification: {
              formRelation: row.form_relation || 'special',
              frequencyBand: row.frequency_band || 'common',
              patternGroups: [],
              recommendedCourses: split(row.recommended_courses),
            },
            notes: row.notes ? [row.notes] : [],
            sources: [],
            examples: [],
            contentStatus: row.content_status || 'needs_review',
          },
        };
      });
    }
    if (input.length > 10000) throw Error('Máximo 10.000 filas.');
    for (const item of input) {
      const value = item.value as any;
      const valid = value?.contentStatus ? adaptLegacyVerb(value) : validate<Verb>('verb', value);
      if (valid.ok) out.rows.push({ row: item.row, verb: valid.value });
      else out.issues.push(...valid.issues.map((issue) => ({ ...issue, row: item.row })));
    }
    const ids = new Set<string>();
    for (const row of out.rows) {
      if (ids.has(row.verb.id))
        out.issues.push({
          row: row.row,
          path: '/id',
          code: 'duplicate',
          message: 'Identificador repetido dentro del archivo.',
        });
      ids.add(row.verb.id);
    }
  } catch (e) {
    out.issues.push({
      path: '',
      code: 'parse',
      message: e instanceof Error ? e.message : String(e),
    });
  }
  return out;
}
export function exportCatalog(verbs: Verb[], format: 'csv' | 'json'): string {
  if (format === 'json')
    return JSON.stringify({ format: 'verbquest-catalog', schemaVersion: 1, verbs }, null, 2);
  return (
    '\ufeff' +
    Papa.unparse(
      verbs.map((v) => ({
        id: v.id,
        base: v.lemma,
        past_simple: v.forms.pastSimple.variants.map((a) => a.value).join(' / '),
        past_participle: v.forms.pastParticiple.variants.map((a) => a.value).join(' / '),
        meanings_es: v.meanings.join('; '),
        form_relation: v.classification.formRelation,
        frequency_band: v.classification.frequencyBand,
        recommended_courses: v.classification.recommendedCourses.join('; '),
        content_status: v.editorialStatus,
        notes: v.notes?.join('\n') ?? '',
      })),
      { escapeFormulae: true },
    )
  );
}
