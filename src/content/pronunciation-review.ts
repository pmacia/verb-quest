import sourceReview from './enrichment-review.json';
import type { Dialect, FormKey, Verb } from '../shared/domain/types';
import type { ReviewedPronunciation } from './enrichment';
export interface PronunciationReview extends ReviewedPronunciation {
  evidence?: { headword: string; section: string; sourceIpa: string };
}
export const pronunciationReview = sourceReview.reviewed as readonly PronunciationReview[];
const forms = ['base', 'pastSimple', 'pastParticiple'] as const;
const dialects = ['uk', 'us'] as const;
const key = (r: Pick<ReviewedPronunciation, 'verbId' | 'form' | 'value' | 'dialect'>) =>
  JSON.stringify([r.verbId, r.form, r.value, r.dialect]);
export function isVerifiedPronunciation(r: PronunciationReview): boolean {
  try {
    const source = new URL(r.source);
    return (
      forms.includes(r.form) &&
      dialects.includes(r.dialect) &&
      source.protocol === 'https:' &&
      [
        'www.oxfordlearnersdictionaries.com',
        'dictionary.cambridge.org',
        'www.britishcouncil.org.mx',
      ].includes(source.hostname) &&
      /^\d{4}-\d{2}-\d{2}$/.test(r.checkedAt) &&
      Number.isFinite(Date.parse(r.checkedAt)) &&
      /^\/[^/\s]+\/$/.test(r.ipa) &&
      r.evidence?.headword === r.value &&
      r.evidence.section.trim().length > 0 &&
      r.evidence.sourceIpa.replace(/\s/g, '') === r.ipa
    );
  } catch {
    return false;
  }
}
/** Only the bundled, individually sourced review can correct or promote a transcription. */
export function applyPronunciationReview(
  verbs: Verb[],
  review: readonly PronunciationReview[],
): Verb[] {
  const verified = new Map(review.filter(isVerifiedPronunciation).map((r) => [key(r), r]));
  return structuredClone(verbs).map((verb) => {
    for (const form of forms) {
      const targets = form === 'base' ? [verb.forms.base] : verb.forms[form].variants;
      for (const target of targets)
        for (const dialect of dialects) {
          const r = verified.get(key({ verbId: verb.id, form, value: target.value, dialect }));
          if (!r) continue;
          target.pronunciation = {
            ...target.pronunciation,
            [dialect]: {
              ...target.pronunciation?.[dialect],
              ipa: r.ipa,
              validated: true,
            },
          };
        }
    }
    return verb;
  });
}
export function reviewedSources(verb: Verb, review: readonly PronunciationReview[]): string[] {
  return [
    ...new Set(
      review
        .filter((r) => {
          if (r.verbId !== verb.id || !forms.includes(r.form) || !isVerifiedPronunciation(r))
            return false;
          const targets = r.form === 'base' ? [verb.forms.base] : verb.forms[r.form].variants;
          return targets.some(
            (target) =>
              target.value === r.value &&
              target.pronunciation?.[r.dialect]?.validated &&
              target.pronunciation[r.dialect]?.ipa === r.ipa,
          );
        })
        .map((r) => r.source),
    ),
  ];
}
export function auditPronunciations(verbs: Verb[], review: readonly PronunciationReview[]) {
  const byDialect = { uk: { expected: 0, validated: 0 }, us: { expected: 0, validated: 0 } };
  const issues: {
    verbId: string;
    form?: FormKey;
    value?: string;
    dialect?: Dialect;
    reason: string;
  }[] = [];
  const verified = new Map<string, PronunciationReview>();
  for (const r of review) {
    if (verified.has(key(r))) issues.push({ verbId: r.verbId, reason: 'duplicate_review_key' });
    if (!isVerifiedPronunciation(r))
      issues.push({ verbId: r.verbId, reason: 'invalid_source_evidence' });
    else verified.set(key(r), r);
  }
  for (const verb of verbs)
    for (const form of forms) {
      const targets = form === 'base' ? [verb.forms.base] : verb.forms[form].variants;
      for (const target of targets)
        for (const dialect of dialects) {
          byDialect[dialect].expected++;
          const id = { verbId: verb.id, form, value: target.value, dialect };
          const p = target.pronunciation?.[dialect];
          const r = verified.get(key(id));
          if (p?.validated && p.ipa && r?.ipa === p.ipa) byDialect[dialect].validated++;
          else
            issues.push({
              ...id,
              reason: !p?.ipa
                ? 'missing_ipa'
                : !p.validated
                  ? 'not_validated'
                  : 'missing_matching_source',
            });
        }
    }
  return {
    expected: byDialect.uk.expected + byDialect.us.expected,
    validated: byDialect.uk.validated + byDialect.us.validated,
    byDialect,
    issues,
  };
}
