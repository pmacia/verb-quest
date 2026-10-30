import { describe, it, expect } from 'vitest';
import { validate, adaptLegacyVerb } from './validation';
import seed from '../../../tests/fixtures/original/verbs.seed.json';
describe('domain validation', () => {
  it('requires the reference matching a plan source', () =>
    expect(
      validate('plan', {
        id: 'p',
        name: 'Plan',
        source: { type: 'saved_list' },
        goals: ['review'],
        schedule: { minutesPerSession: 10, newVerbsPerSession: 0 },
        createdAt: '2026-10-29T00:00:00Z',
      }).ok,
    ).toBe(false));
  it('adapts all eight original verbs without losing forms', () => {
    expect(seed.verbs).toHaveLength(8);
    for (const v of seed.verbs) {
      const r = adaptLegacyVerb(v);
      expect(r.ok).toBe(true);
      if (!r.ok) throw Error('Invalid fixture');
      expect(r.value).toMatchObject({
        id: v.id,
        editorialStatus: 'needs_review',
        archivedAt: null,
      });
    }
  });
  it('rejects executable URLs', () =>
    expect(
      adaptLegacyVerb({ ...seed.verbs[0], sources: [{ url: 'javascript:alert(1)' }] }).ok,
    ).toBe(false));
  it('rejects future backup versions', () =>
    expect(validate('backup', { format: 'verbquest-backup', schemaVersion: 99 }).ok).toBe(false));
});
it('rejects whitespace-only linguistic fields', () => {
  const result = adaptLegacyVerb({ ...seed.verbs[1], meanings: ['  '] });
  expect(result.ok).toBe(false);
});
