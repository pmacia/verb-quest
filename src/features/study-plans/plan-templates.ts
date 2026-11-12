import type { StudyPlan, PlanSource, PlanGoal, QuestionMode } from '../../shared/domain/types';
const completePractice: QuestionMode[] = [
  'flashcards',
  'matching',
  'quiz',
  'written_recall',
  'audio_detective',
  'sentence_gap',
];
function preset(
  id: string,
  name: string,
  description: string,
  options: {
    source?: PlanSource;
    goals?: PlanGoal[];
    modes?: QuestionMode[];
    minutes?: 5 | 10 | 15;
    newVerbs?: number;
  } = {},
): StudyPlan {
  return {
    id: `template-${id}`,
    profileId: 'template',
    name,
    description,
    source: options.source ?? { type: 'filter', filter: {} },
    goals: options.goals ?? ['mixed'],
    schedule: {
      minutesPerSession: options.minutes ?? 10,
      newVerbsPerSession: options.newVerbs ?? 4,
      daysPerWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      remindersEnabled: false,
    },
    questionModes: [...(options.modes ?? completePractice)],
    order: 'adaptive',
    difficulty: 'all',
    selectionPolicy: 'resolve_at_start',
    isTemplate: true,
    createdAt: '2026-10-29T00:00:00Z',
  };
}
export const templates: StudyPlan[] = [
  preset(
    'zero',
    'Empiezo desde cero',
    'Reconoce y recuerda las formas de los verbos esenciales, paso a paso.',
    {
      source: { type: 'filter', filter: { frequencies: ['essential'] } },
      goals: ['recognition', 'recall'],
      modes: ['flashcards', 'matching', 'quiz'],
      minutes: 5,
      newVerbs: 2,
    },
  ),
  preset(
    'eso1',
    '1.º ESO · Básicos',
    'Práctica completa con los verbos cotidianos recomendados para 1.º.',
    { source: { type: 'course', course: 'eso1' }, newVerbs: 3 },
  ),
  preset(
    'eso2',
    '2.º ESO · Consolidación',
    'Repasa la base y añade los verbos recomendados para 2.º.',
    { source: { type: 'course', course: 'eso2' } },
  ),
  preset(
    'eso3',
    '3.º ESO · Ampliación',
    'Amplía vocabulario y conecta formas, escucha, escritura y frases.',
    { source: { type: 'course', course: 'eso3' }, minutes: 15, newVerbs: 5 },
  ),
  preset(
    'eso4',
    '4.º ESO · Repaso general',
    'Repaso acumulativo de los verbos recomendados hasta 4.º.',
    { source: { type: 'course', course: 'eso4' }, minutes: 15, newVerbs: 6 },
  ),
  preset(
    'exam',
    'Preparación de examen',
    'Elige tu lista y practica recordar, escribir y completar frases.',
    {
      source: { type: 'saved_list', listId: '' },
      goals: ['recall', 'spelling', 'context'],
      modes: ['written_recall', 'sentence_gap'],
      minutes: 15,
      newVerbs: 6,
    },
  ),
  preset(
    'audio',
    'Entrenamiento auditivo',
    'Escucha las formas y reconoce qué verbo y variante has oído.',
    { goals: ['listening'], modes: ['audio_detective'], minutes: 5, newVerbs: 4 },
  ),
  preset(
    'patterns',
    'Patrones y terminaciones',
    'Descubre la familia ought: bought, brought, thought y otras formas relacionadas.',
    {
      source: { type: 'filter', filter: { families: ['ought'] } },
      goals: ['recognition', 'spelling'],
      modes: ['matching', 'written_recall'],
      newVerbs: 3,
    },
  ),
  preset(
    'difficult',
    'Mis verbos difíciles',
    'Refuerza los verbos que necesitan repaso, sin introducir otros nuevos.',
    { source: { type: 'filter', filter: { states: ['needs_review'] } }, minutes: 5, newVerbs: 0 },
  ),
  preset(
    'context',
    'Verbos en contexto',
    'Completa frases para practicar los significados y usos de las formas verbales.',
    { goals: ['context'], modes: ['sentence_gap'] },
  ),
];
