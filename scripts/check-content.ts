import verbs from '../src/content/verbs.curated.json';
import manifest from '../src/content/review-manifest.json';
import { checkContent } from './lib/content-audit';
import type { Verb } from '../src/shared/domain/types';
const r = checkContent(
  { version: 'curated-1.0', kind: 'curated', verbs: verbs as Verb[] },
  manifest,
);
console.log(JSON.stringify(r, null, 2));
if (!r.publishable) process.exitCode = 1;
