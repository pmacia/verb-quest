import { patternLabel } from '../catalog/classification-labels';
import type { QuestionMode, StudyPlan, VerbList } from '../../shared/domain/types';
export const modeLabels: Record<QuestionMode, string> = {
  flashcards: 'Flashcards',
  matching: 'Emparejar',
  quiz: 'Quiz',
  written_recall: 'Memoria y escritura',
  audio_detective: 'Audio Detective',
  sentence_gap: 'Completa la frase',
};
const goals: Record<string, string> = {
  learn: 'Práctica completa',
  mixed: 'Práctica completa',
  review: 'Repaso',
  recognition: 'Reconocimiento',
  recall: 'Memoria',
  listening: 'Escucha',
  spelling: 'Escritura',
  context: 'Frases',
  pronunciation: 'Pronunciación',
};
export const practiceLabel = (plan: StudyPlan) =>
  plan.goals.map((goal) => goals[goal] ?? goal).join(' · ');
export function planIcon(plan: StudyPlan) {
  return plan.id === 'template-audio'
    ? 'sound'
    : plan.id === 'template-context'
      ? 'book'
      : plan.id === 'template-patterns'
        ? 'filter'
        : plan.id === 'template-difficult'
          ? 'restore'
          : plan.id === 'template-exam'
            ? 'edit'
            : 'study';
}
export function planTone(plan: StudyPlan) {
  return plan.id === 'template-context' || plan.id === 'template-audio'
    ? 'teal'
    : plan.id === 'template-patterns' || plan.id === 'template-difficult'
      ? 'purple'
      : 'blue';
}
export function sourceLabel(plan: StudyPlan, lists: VerbList[]) {
  const source = plan.source;
  if (source.type === 'course') return `${source.course.replace('eso', '')}.º ESO · acumulativo`;
  if (source.type === 'saved_list')
    return lists.find((list) => list.id === source.listId)?.name ?? 'Elige una lista';
  if (source.type === 'manual' || source.type === 'imported') return 'Selección propia';
  if (source.filter.families?.length) return source.filter.families.map(patternLabel).join(' · ');
  if (source.filter.states?.includes('needs_review')) return 'Necesitan refuerzo';
  if (source.filter.frequencies?.includes('essential')) return 'Verbos esenciales';
  return Object.values(source.filter).some((value) => Array.isArray(value) && value.length)
    ? 'Según tus filtros'
    : 'Todo el catálogo activo';
}
export function withExamList(plan: StudyPlan, listId?: string): StudyPlan {
  return plan.isTemplate && plan.id === 'template-exam' && listId
    ? { ...plan, source: { type: 'saved_list', listId } }
    : plan;
}
