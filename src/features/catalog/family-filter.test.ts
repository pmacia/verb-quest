import { expect, it } from 'vitest';
import { dataset } from '../../content/dataset';
import { filterFamilyCandidates, getFamilyOptions, effectiveFamilies } from './family-filter';
const verbs = dataset.verbs;
it('groups by actual relations, including shared families', () => {
  const special = getFamilyOptions(verbs, 'special');
  expect(special.map((x) => x.id)).toContain('Especial');
  expect(special.map((x) => x.id)).toContain('ABB_elt');
  expect(special.map((x) => x.id)).not.toContain('ABC_i_a_u');
  expect(getFamilyOptions(verbs, 'all_different').map((x) => x.id)).toContain('Especial');
});
it('uses detailed families instead of redundant historical tags', () => {
  expect(effectiveFamilies(verbs.find((v) => v.id === 'buy')!)).toEqual(['ABB_ought']);
  const custom = {
    ...verbs[0],
    classification: { ...verbs[0].classification, patternGroups: ['participio-en'] },
  };
  expect(effectiveFamilies(custom)).toEqual(['participio-en']);
  expect(
    effectiveFamilies({
      ...custom,
      classification: { ...custom.classification, patternGroups: ['custom', 'custom'] },
    }),
  ).toEqual(['custom']);
});
it('all, subset and no families are distinct and compose with relation', () => {
  expect(filterFamilyCandidates(verbs, 'all_same', null).map((v) => v.id)).toEqual(
    verbs.filter((v) => v.classification.formRelation === 'all_same').map((v) => v.id),
  );
  expect(filterFamilyCandidates(verbs, '', ['ABC_i_a_u']).map((v) => v.id)).toContain('sing');
  expect(filterFamilyCandidates(verbs, 'special', ['Especial']).map((v) => v.id)).toEqual(['be']);
  expect(filterFamilyCandidates(verbs, '', [])).toEqual([]);
  expect(filterFamilyCandidates(verbs, '', null)).toHaveLength(120);
});
it('keeps custom verbs with no families in a selectable fallback', () => {
  const custom = { ...verbs[0], classification: { ...verbs[0].classification, patternGroups: [] } };
  expect(getFamilyOptions([custom], 'special')).toEqual([{ id: '', count: 1 }]);
  expect(filterFamilyCandidates([custom], 'special', [''])).toEqual([custom]);
});
