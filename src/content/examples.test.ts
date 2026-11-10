import { expect, it } from 'vitest';
import { curatedDataset } from './curated-dataset';
import { generateQuestions } from '../features/question-engine/generate';
import { learningRevision } from '../features/question-engine/revision';
it('ships the reviewed 453 examples with unique IDs, real targets and compatible answers', () => {
  const ids = new Set<string>();
  expect(curatedDataset.verbs.reduce((count, verb) => count + verb.examples.length, 0)).toBe(453);
  for (const verb of curatedDataset.verbs)
    for (const ex of verb.examples) {
      expect(ids.has(ex.id), ex.id).toBe(false);
      ids.add(ex.id);
      expect(ex.sentence.toLowerCase()).toContain(ex.targetForm.toLowerCase());
      expect(ex.translation.trim(), ex.id).not.toBe('');
      const values =
        ex.form === 'base'
          ? [verb.forms.base.value]
          : verb.forms[ex.form!].variants
              .filter(
                (v) =>
                  !v.dialect ||
                  v.dialect === 'all' ||
                  ex.dialect === 'neutral' ||
                  v.dialect === ex.dialect,
              )
              .map((v) => v.value);
      expect(values, ex.id).toContain(ex.targetForm);
      expect(ex.acceptedAnswers, ex.id).toContain(ex.targetForm);
      expect(
        ex.acceptedAnswers!.every((value) => values.includes(value)),
        ex.id,
      ).toBe(true);
    }
});
it('generates fully covered context exercises in either dialect with different random selections', () => {
  for (const dialect of ['uk', 'us'] as const)
    for (const value of [0, 0.25, 0.5, 0.999]) {
      const result = generateQuestions(
        {
          verbs: curatedDataset.verbs,
          skills: ['context'],
          modes: ['sentence_gap'],
          dialect,
          allowFixtures: false,
        },
        () => value,
      );
      expect(result.unavailable).toEqual([]);
      expect(result.questions.length).toBe(361);
      for (const question of result.questions)
        expect(question.acceptedAnswers.length).toBeGreaterThan(0);
    }
});
it('exposes alternate spellings and contextual senses while preserving non-context learning evidence', () => {
  for (const id of ['learn', 'burn', 'dream', 'smell', 'spell', 'spill', 'kneel', 'lean']) {
    const verb = curatedDataset.verbs.find((v) => v.id === id)!;
    for (const variant of verb.forms.pastSimple.variants)
      expect(
        verb.examples.some((ex) => ex.targetForm === variant.value),
        id,
      ).toBe(true);
  }
  const verb = structuredClone(curatedDataset.verbs.find((v) => v.id === 'know')!);
  const edited = { ...verb, examples: [] };
  for (const skill of ['recognition', 'recall', 'listening', 'spelling'] as const)
    expect(learningRevision(verb, skill)).toBe(learningRevision(edited, skill));
  expect(learningRevision(verb, 'context')).not.toBe(learningRevision(edited, 'context'));
});
