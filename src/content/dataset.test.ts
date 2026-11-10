import { it, expect } from 'vitest';
import { dataset } from './dataset';
import manifest from './review-manifest.json';
import { checkContent } from '../../scripts/lib/content-audit';
import { auditPronunciations, pronunciationReview } from './pronunciation-review';
it('the distributed loader exposes a versioned catalogue that passes current publication checks', () => {
  expect(dataset.version.trim()).not.toBe('');
  expect(new Set(dataset.verbs.map((verb) => verb.id)).size).toBe(dataset.verbs.length);
  expect(checkContent(dataset, manifest).errors).toEqual([]);
  expect(auditPronunciations(dataset.verbs, pronunciationReview).issues).toEqual([]);
});
