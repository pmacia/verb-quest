import verbs from './verbs.curated.json';
import additions from './catalog-enrichment.json';
import review from './enrichment-review.json';
import { enrichVerbs, type VerbEnrichment, type ReviewedPronunciation } from './enrichment';
import type { Dataset, Verb } from '../shared/domain/types';
export const dataset: Dataset = {
  version: 'curated-1.1',
  kind: 'curated',
  verbs: enrichVerbs(
    verbs as Verb[],
    additions.entries as VerbEnrichment[],
    review.reviewed as ReviewedPronunciation[],
  ),
};
