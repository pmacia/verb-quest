import verbs from './verbs.curated.json';
import type { Dataset, Verb } from '../shared/domain/types';
export const dataset: Dataset = { version: 'curated-1.0', kind: 'curated', verbs: verbs as Verb[] };
