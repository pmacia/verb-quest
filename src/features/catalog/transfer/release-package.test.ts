import { expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { dataset } from '../../../content/dataset';
import { getVerbIcon } from '../verb-icons';
import { buildReleasePackage } from './release-package';
const options = {
  version: dataset.version === 'test-release' ? 'test-release-2' : 'test-release',
  currentVersion: dataset.version,
  exportedAt: '2026-11-10T12:00:00Z',
};
it('packages the full catalogue, resolved icons, archive state and a direct dataset loader', () => {
  const verbs = structuredClone(dataset.verbs);
  verbs[0].icon = '🌟';
  verbs[0].archivedAt = options.exportedAt;
  const result = buildReleasePackage(verbs, options);
  const files = unzipSync(result.bytes);
  const release = JSON.parse(strFromU8(files['src/content/catalog.release.json']));
  expect(release).toEqual({
    version: options.version,
    kind: 'curated',
    verbs: verbs.map((v) => ({ ...v, icon: getVerbIcon(v) })),
  });
  const loader = strFromU8(files['src/content/dataset.ts']);
  expect(loader).toContain('./catalog.release.json');
  expect(loader).not.toMatch(/enrichVerbs|applyFormTranslations|applyPronunciationReview/);
  expect(Object.keys(files).sort()).toEqual(
    [
      'PUBLICATION_REPORT.json',
      'README-PUBLICAR.md',
      'src/content/catalog.release.json',
      'src/content/dataset.ts',
    ].sort(),
  );
  expect(strFromU8(files['README-PUBLICAR.md'])).toContain('npm run content:check');
  expect(result.report.editorialReady).toBe(true);
  expect(result.report.counts.archived).toBe(1);
});
it('refuses invalid versions, invalid records and duplicate identities', () => {
  for (const version of ['', dataset.version, '../invalid'])
    expect(() => buildReleasePackage(dataset.verbs, { ...options, version })).toThrow();
  expect(() => buildReleasePackage([], options)).toThrow();
  expect(() => buildReleasePackage([dataset.verbs[0], dataset.verbs[0]], options)).toThrow(
    /duplicado/i,
  );
  expect(() => buildReleasePackage([{ ...dataset.verbs[0], icon: '' }], options)).toThrow();
});
it('does not promote unreviewed content or claim publication readiness', () => {
  const verbs = structuredClone(dataset.verbs);
  verbs[0].editorialStatus = 'needs_review';
  verbs[0].forms.base.pronunciation!.uk!.ipa = '/x/';
  const result = buildReleasePackage(verbs, options);
  expect(result.report.editorialReady).toBe(false);
  const files = unzipSync(result.bytes);
  const release = JSON.parse(strFromU8(files['src/content/catalog.release.json']));
  expect(release.verbs[0].editorialStatus).toBe('needs_review');
  expect(release.verbs[0].forms.base.pronunciation.uk.ipa).toBe('/x/');
  expect(result.report.ipa.issues.length).toBeGreaterThan(0);
});
it('flags edited meanings even when a historical manifest entry still exists', () => {
  const verbs = structuredClone(dataset.verbs);
  verbs[0].meanings = ['un significado nuevo sin revisión'];
  const result = buildReleasePackage(verbs, options);
  expect(result.report.editorialReady).toBe(false);
  expect(result.report.changedIds).toContain(verbs[0].id);
});
