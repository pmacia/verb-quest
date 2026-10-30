import type { SkillProgress } from '../../shared/domain/types';
import { deriveVisibleState } from '../learning-engine/progress';
export const skillLabels = {
  recognition: 'Reconocimiento',
  recall: 'Memoria',
  listening: 'Escucha',
  spelling: 'Escritura',
  context: 'En contexto',
  pronunciation: 'Pronunciación',
};
export const stateLabels = {
  new: 'Nuevo',
  learning: 'En aprendizaje',
  needs_review: 'Necesita refuerzo',
  consolidating: 'Consolidando',
  mastered: 'Dominado',
};
export function summarizeVerb(progress: SkillProgress[], today: string) {
  const mastered = progress.filter((p) => deriveVisibleState(p, today) === 'mastered').length;
  return {
    mastered,
    total: 5,
    pronunciation: 'Sin evaluar',
    label:
      mastered === 5
        ? 'Dominado en las habilidades evaluadas'
        : `${mastered} de 5 habilidades dominadas`,
  };
}
