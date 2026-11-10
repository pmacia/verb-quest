import type { Verb } from '../../src/shared/domain/types';
/** A current editable record, including fields absent from the original CSV. */
export function editedVerb(input: Verb): Verb {
  const verb = structuredClone(input);
  verb.forms.base.pronunciation ??= {};
  verb.definitions = [
    {
      text: 'To obtain something or receive it.',
      dialects: ['uk', 'us'],
      sources: [
        {
          label: 'Referencia de prueba',
          url: 'https://dictionary.cambridge.org/dictionary/english/get',
          checkedAt: '2026-11-10',
        },
      ],
      reviewStatus: 'needs_review',
    },
  ];
  verb.icon = '🧩';
  verb.meaningNotes = 'Nota de significado';
  verb.forms.base.translation = 'obtener';
  verb.forms.base.pronunciation!.uk = {
    ...verb.forms.base.pronunciation!.uk,
    audioUrl: 'https://example.org/get.mp3',
    audioSource: 'Grabación propia',
    audioLicense: 'CC0',
  };
  verb.forms.pastSimple.variants[0].translation = 'obtuve';
  verb.forms.pastSimple.usageNotes = ['Nota del pasado'];
  verb.forms.pastParticiple.variants[0].translation = 'obtenido';
  verb.forms.thirdPersonSingular = {
    variants: [{ value: 'gets', translation: 'obtiene', dialect: 'all' }],
  };
  verb.forms.presentParticiple = { variants: [{ value: 'getting', translation: 'obteniendo' }] };
  verb.forms.otherForms = [
    {
      label: 'Negación',
      group: { variants: [{ value: 'did not get', translation: 'no obtuve' }] },
    },
  ];
  verb.mnemonics = ['Una pista de prueba'];
  verb.examples[0].audioUrl = 'https://example.org/example.mp3';
  verb.examples[0].acceptedAnswers = [verb.examples[0].targetForm];
  verb.archivedAt = '2026-11-10T00:00:00Z';
  verb.updatedAt = verb.archivedAt;
  return verb;
}
