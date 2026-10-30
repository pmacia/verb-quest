import type { Verb } from '../shared/domain/types';
import { it, expect } from 'vitest';
import verbs from './verbs.curated.json';
import manifest from './review-manifest.json';
import { checkContent } from '../../scripts/lib/content-audit';
it('ships 120 unique reviewed verbs, original contextual examples and course references', () => {
  expect(verbs).toHaveLength(120);
  expect(new Set(verbs.map((v: any) => v.id)).size).toBe(120);
  expect(
    checkContent({ version: '1', kind: 'curated', verbs: verbs as Verb[] }, manifest).publishable,
  ).toBe(true);
});
it('never approves an empty catalog or an unreviewed example', () => {
  expect(checkContent({ version: '1', kind: 'curated', verbs: [] }, manifest).publishable).toBe(
    false,
  );
  if (verbs.length) {
    const changed = structuredClone(verbs) as any[];
    changed[0].examples[0].reviewStatus = 'needs_review';
    expect(
      checkContent({ version: '1', kind: 'curated', verbs: changed }, manifest).publishable,
    ).toBe(false);
  }
});
