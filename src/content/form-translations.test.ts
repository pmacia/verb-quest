import { expect, it } from 'vitest';
import { dataset } from './dataset';
import { learningRevision } from '../features/question-engine/revision';
import { validate } from '../shared/domain/validation';
it('covers all 120 verbs and variants without changing learning evidence or legacy validity', () => {
  expect(dataset.verbs).toHaveLength(120);
  for (const verb of dataset.verbs) {
    const forms = [
      verb.forms.base,
      ...verb.forms.pastSimple.variants,
      ...verb.forms.pastParticiple.variants,
    ];
    expect(
      forms.every((f) => !!f.translation?.trim()),
      verb.id,
    ).toBe(true);
    expect(validate('verb', verb).ok, verb.id).toBe(true);
    const old = structuredClone(verb);
    [
      old.forms.base,
      ...old.forms.pastSimple.variants,
      ...old.forms.pastParticiple.variants,
    ].forEach((f) => delete f.translation);
    expect(validate('verb', old).ok).toBe(true);
    expect(learningRevision(old, 'spelling')).toBe(learningRevision(verb, 'spelling'));
  }
});
it('distinguishes conjugated translations and preserves written read and be variants', () => {
  const get = (id: string) => dataset.verbs.find((v) => v.id === id)!;
  expect(get('go').forms.pastSimple.variants[0].translation).toBe('fui / fue');
  expect(get('go').forms.pastParticiple.variants[0].translation).toBe('ido');
  expect(get('read').forms.pastParticiple.variants[0].translation).toBe('leído');
  expect(get('be').forms.pastSimple.variants.map((v) => v.translation)).toEqual([
    'fui / fue; estuve / estuvo',
    'fuiste / fuimos / fueron; estuviste / estuvimos / estuvieron',
  ]);
});
