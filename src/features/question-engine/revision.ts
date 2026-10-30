import type { Verb, EvaluatedSkill } from '../../shared/domain/types';
// Semantic identity: translations, audio and editorial metadata do not invalidate evidence.
export function learningRevision(verb: Verb, skill: EvaluatedSkill): string {
  return JSON.stringify({
    base: verb.forms.base.value,
    pastSimple: verb.forms.pastSimple.variants.map(({ value, dialect, usageNote }) => ({
      value,
      dialect,
      usageNote,
    })),
    pastParticiple: verb.forms.pastParticiple.variants.map(({ value, dialect, usageNote }) => ({
      value,
      dialect,
      usageNote,
    })),
    ...(skill === 'context'
      ? {
          examples: verb.examples.map(
            ({
              sentence,
              targetForm,
              grammarPoint,
              form,
              acceptedAnswers,
              dialect,
              reviewStatus,
            }) => ({
              sentence,
              targetForm,
              grammarPoint,
              form,
              acceptedAnswers,
              dialect,
              reviewStatus,
            }),
          ),
        }
      : {}),
  });
}
