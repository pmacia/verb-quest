import verbs from './verbs.curated.json';
import additions from './catalog-enrichment.json';
import { enrichVerbs, type VerbEnrichment } from './enrichment';
import { applyPronunciationReview, pronunciationReview } from './pronunciation-review';
import type { Dataset, Verb } from '../shared/domain/types';
export const dataset: Dataset = {
  version: 'curated-1.2',
  kind: 'curated',
  verbs: applyPronunciationReview(
    enrichVerbs(verbs as Verb[], additions.entries as VerbEnrichment[], pronunciationReview),
    pronunciationReview,
  ),
};
