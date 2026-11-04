import type { Verb } from '../../shared/domain/types';
import { effectiveFamilies, familyLabel } from './family-filter';
import { topicLabel } from './classification-labels';
export const frequencyLabels: Record<string, string> = {
  essential: 'Esencial',
  common: 'Frecuente',
  less_common: 'Menos frecuente',
  advanced: 'Avanzado',
};
export const relationLabels: Record<string, string> = {
  all_same: 'AAA · Tres iguales',
  past_participle_same: 'ABB · Pasado y participio iguales',
  all_different: 'ABC · Tres diferentes',
  special: 'Formas especiales',
};
export function VerbBadges({ verb, detailed = false }: { verb: Verb; detailed?: boolean }) {
  const courses = verb.classification.recommendedCourses;
  const difficulty = { introductory: 'Inicial', intermediate: 'Intermedia', advanced: 'Avanzada' };
  return (
    <div className="verb-badges" aria-label={`Características de ${verb.lemma}`}>
      {!!courses.length && (
        <span className="tag badge-course">
          {detailed
            ? courses.map((c) => `${c.replace('eso', '')}.º`).join(' / ') + ' ESO'
            : `Desde ${courses[0].replace('eso', '')}.º ESO`}
        </span>
      )}
      <span className="tag badge-pattern">{relationLabels[verb.classification.formRelation]}</span>
      <span className="tag badge-frequency">
        {frequencyLabels[verb.classification.frequencyBand]}
      </span>
      {detailed && (
        <>
          {effectiveFamilies(verb)
            .filter(Boolean)
            .map((f) => (
              <span className="tag" key={f}>
                {familyLabel(f)}
              </span>
            ))}
          {(verb.classification.topics ?? []).map((topic) => (
            <span className="tag badge-topic" key={topic}>
              {topicLabel(topic)}
            </span>
          ))}
          {verb.classification.difficulty && (
            <span className="tag">Dificultad: {difficulty[verb.classification.difficulty]}</span>
          )}
        </>
      )}
    </div>
  );
}
