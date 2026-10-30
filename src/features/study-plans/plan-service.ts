import type {
  StudyPlan,
  ResolvedSelection,
  Verb,
  VerbList,
  SkillProgress,
  EvaluatedSkill,
  ValidationIssue,
  QuestionMode,
  PlanSource,
} from '../../shared/domain/types';
import type { AppRepositories } from '../persistence/repositories';
import { queryCatalog } from '../catalog/query';
import { validate } from '../../shared/domain/validation';
import type { QuestionGenerationResult } from '../question-engine/generate';
export const allSkills: EvaluatedSkill[] = [
  'recognition',
  'recall',
  'listening',
  'spelling',
  'context',
];
export function planSkills(p: StudyPlan): EvaluatedSkill[] {
  if (p.goals.some((g) => ['learn', 'review', 'mixed'].includes(g))) return allSkills;
  return p.goals.filter((g) => allSkills.includes(g as EvaluatedSkill)) as EvaluatedSkill[];
}
const modes: QuestionMode[] = [
  'flashcards',
  'matching',
  'quiz',
  'written_recall',
  'audio_detective',
  'sentence_gap',
];
export const templates: StudyPlan[] = [
  ['zero', 'Empiezo desde cero', 'Primeros pasos con los verbos esenciales.'],
  ['eso1', '1.º ESO · Básicos', 'Los verbos de cada día.'],
  ['eso2', '2.º ESO · Consolidación', 'Afianza tu base y sigue creciendo.'],
  ['eso3', '3.º ESO · Ampliación', 'Nuevas formas para contar más historias.'],
  ['eso4', '4.º ESO · Repaso general', 'Conecta todo lo que has aprendido.'],
  ['exam', 'Preparación de examen', 'Tu lista, a tu ritmo.'],
  ['audio', 'Entrenamiento auditivo', 'Aprende a reconocer cada sonido.'],
  ['patterns', 'Patrones y terminaciones', 'Descubre lo que tienen en común.'],
  ['difficult', 'Mis verbos difíciles', 'Una nueva oportunidad para tus errores.'],
].map(([id, name, description]) => ({
  id: `template-${id}`,
  profileId: 'template',
  name,
  description,
  source:
    id === 'zero'
      ? { type: 'filter', filter: { frequencies: ['essential'] } }
      : id.startsWith('eso')
        ? { type: 'course', course: id }
        : id === 'difficult'
          ? { type: 'filter', filter: { states: ['needs_review'] } }
          : id === 'exam'
            ? { type: 'manual', verbIds: [] }
            : { type: 'filter', filter: {} },
  goals: id === 'audio' ? ['listening'] : ['mixed'],
  schedule: {
    minutesPerSession: 10,
    newVerbsPerSession: 4,
    daysPerWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
    remindersEnabled: false,
  },
  questionModes: id === 'audio' ? ['audio_detective'] : modes,
  order: 'adaptive',
  difficulty: 'all',
  selectionPolicy: 'resolve_at_start',
  isTemplate: true,
  createdAt: '2026-10-29T00:00:00Z',
}));
export function resolvePlanSelection(
  plan: StudyPlan,
  context: { verbs: Verb[]; lists: VerbList[]; progress: SkillProgress[]; today?: string },
): ResolvedSelection {
  const s = plan.source;
  let candidates: string[];
  if (s.type === 'saved_list')
    candidates = context.lists.find((l) => l.id === s.listId)?.verbIds ?? [];
  else if (s.type === 'manual' || s.type === 'imported') candidates = s.verbIds;
  else {
    const filter = s.type === 'course' ? { courses: [s.course] } : s.filter;
    candidates = queryCatalog(
      context.verbs,
      { text: '', filter, sort: 'alphabetical', direction: 'asc' },
      {
        lists: context.lists,
        progress: context.progress,
        today: context.today ?? new Date().toISOString().slice(0, 10),
      },
    ).items.map((v) => v.id);
  }
  const verbIds = [...new Set(candidates)].filter((id) => {
    const v = context.verbs.find((v) => v.id === id);
    return (
      v &&
      !v.archivedAt &&
      (plan.difficulty === 'all' || v.classification.difficulty === plan.difficulty)
    );
  });
  const excludedIds = candidates.filter((id) => !verbIds.includes(id));
  return {
    verbIds,
    excludedIds,
    reasons: excludedIds.length
      ? [`${excludedIds.length} verbos no disponibles o fuera de la dificultad elegida.`]
      : [],
  };
}
export function validatePlanCompatibility(
  plan: StudyPlan,
  available: QuestionGenerationResult,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const skill of planSkills(plan))
    if (!available.questions.some((q) => q.skill === skill))
      issues.push({
        path: '/goals',
        code: 'unavailable',
        message: `No hay actividades aptas para ${skill}. Cambia la selección o las modalidades.`,
      });
  if (plan.goals.includes('pronunciation'))
    issues.push({
      path: '/goals',
      code: 'unavailable',
      message: 'La pronunciación no se evalúa en esta versión.',
    });
  return issues;
}
export async function savePlan(repos: AppRepositories, plan: StudyPlan) {
  const r = validate<StudyPlan>('plan', plan);
  if (!r.ok) throw Error(r.issues.map((i) => i.message).join(' · '));
  await repos.plans.put(r.value);
}
