import { applyFormTranslations } from './form-translations';
import verbs from './verbs.curated.json';
import additions from './catalog-enrichment.json';
import { enrichVerbs, type VerbEnrichment } from './enrichment';
import { applyPronunciationReview, pronunciationReview } from './pronunciation-review';
import type { Dataset, Verb } from '../shared/domain/types';
const version = 'curated-1.5';
export const curatedDataset: Dataset = {
  version,
  kind: 'curated',
  verbs: applyFormTranslations(
    applyPronunciationReview(
      enrichVerbs(verbs as Verb[], additions.entries as VerbEnrichment[], pronunciationReview),
      pronunciationReview,
    ),
  ).map((verb) => ({ ...verb, contentVersion: version })),
};
