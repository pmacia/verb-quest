import { createId } from '../../shared/identity/create-id';
import type {
  Verb,
  EvaluatedSkill,
  Dialect,
  QuestionMode,
  Question,
  FormKey,
} from '../../shared/domain/types';
import { getCoverageTargets } from './coverage';
import { learningRevision } from './revision';
import { formValues } from '../catalog/query';
export interface GenerationInput {
  verbs: Verb[];
  skills: EvaluatedSkill[];
  modes: QuestionMode[];
  dialect: Dialect;
  allowFixtures: boolean;
}
export interface QuestionGenerationResult {
  questions: Question[];
  unavailable: { verbId: string; reason: string }[];
}
export function shuffle<T>(values: T[], rng: () => number) {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const labels: Record<FormKey, string> = {
  base: 'forma base',
  pastSimple: 'pasado simple',
  pastParticiple: 'participio pasado',
};
export function generateQuestions(
  input: GenerationInput,
  rng: () => number,
): QuestionGenerationResult {
  const result: QuestionGenerationResult = { questions: [], unavailable: [] };
  for (const v of input.verbs) {
    if (v.archivedAt) continue;
    if (!input.allowFixtures && v.editorialStatus !== 'validated') {
      result.unavailable.push({ verbId: v.id, reason: 'Contenido pendiente de revisión' });
      continue;
    }
    for (const mode of input.modes) {
      if (mode === 'audio_detective' && v.lemma === 'read') {
        result.unavailable.push({
          verbId: v.id,
          reason: 'La voz aislada no garantiza la distinción de pronunciación de read.',
        });
        continue;
      }
      const skills: EvaluatedSkill[] =
        mode === 'flashcards'
          ? ['recall']
          : mode === 'quiz' || mode === 'matching'
            ? ['recognition']
            : mode === 'audio_detective'
              ? ['listening']
              : mode === 'sentence_gap'
                ? ['context']
                : ['recall', 'spelling'];
      for (const skill of skills.filter((s) => input.skills.includes(s))) {
        const targets = getCoverageTargets(v, skill, input.dialect);
        if (mode === 'matching') {
          const matchingPairs = targets.map((t) => {
            const acceptedAnswers =
              t.form === 'base'
                ? [v.forms.base.value]
                : v.forms[t.form].variants
                    .filter(
                      (a) =>
                        (!a.dialect || a.dialect === 'all' || a.dialect === input.dialect) &&
                        (!t.contextKey || a.value === t.variantValue),
                    )
                    .map((a) => a.value);
            return {
              id: t.id,
              left:
                t.form === 'base'
                  ? `Forma base · ${v.meanings[0]}`
                  : `${labels[t.form]}${t.contextKey ? (t.contextKey === 'singular' ? ' · I/he/she/it' : ' · you/we/they') : ''}`,
              right: acceptedAnswers[0],
              acceptedAnswers,
              coverageTargetIds: [t.id],
              target: t.form,
            };
          });
          if (matchingPairs.length)
            result.questions.push({
              id: createId(),
              version: '1',
              verbId: v.id,
              contentVersion: v.contentVersion,
              coverageVersion: learningRevision(v, skill),
              mode,
              skill,
              target: 'base',
              coverageTargetIds: targets.map((t) => t.id),
              prompt: `Empareja las formas de «${v.lemma}».`,
              acceptedAnswers: matchingPairs.map((p) => p.right),
              options: shuffle(
                matchingPairs.map((p) => p.right),
                rng,
              ),
              matchingPairs,
              explanation: matchingPairs
                .map((p) => `${p.left}: ${p.acceptedAnswers.join(' / ')}`)
                .join('. '),
              evidenceKind: 'objective',
              isWritten: false,
            });
          continue;
        }
        for (const t of targets) {
          let accepted =
            t.form === 'base'
              ? [v.forms.base.value]
              : v.forms[t.form].variants
                  .filter(
                    (a) =>
                      (!a.dialect || a.dialect === 'all' || a.dialect === input.dialect) &&
                      (!t.contextKey || a.value === t.variantValue),
                  )
                  .map((a) => a.value);
          let prompt =
            t.form === 'base'
              ? `Escribe la forma base de «${v.meanings[0]}».`
              : `¿Cuál es el ${labels[t.form]} de «${v.lemma}»?`;
          let explanation = `${v.lemma} → ${accepted.join(' / ')} (${labels[t.form]}).`;
          let audioText: string | undefined;
          let options: string[] = [];
          if (t.contextKey)
            prompt +=
              t.contextKey === 'singular' ? ' Sujeto: I/he/she/it.' : ' Sujeto: you/we/they.';
          if (mode === 'sentence_gap') {
            const ex = v.examples.find(
              (e) =>
                (!e.dialect || e.dialect === 'neutral' || e.dialect === input.dialect) &&
                (e.reviewStatus === 'validated' || input.allowFixtures) &&
                (e.form ??
                  (/perfect|participle|passive/i.test(e.grammarPoint)
                    ? 'pastParticiple'
                    : /past/i.test(e.grammarPoint)
                      ? 'pastSimple'
                      : 'base')) === t.form &&
                (!t.contextKey || e.targetForm === t.variantValue),
            );
            if (!ex) {
              result.unavailable.push({
                verbId: v.id,
                reason: `Falta ejemplo revisado para ${t.id}`,
              });
              continue;
            }
            const escaped = ex.targetForm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`\\b${escaped}\\b`, 'i');
            if (!re.test(ex.sentence)) {
              result.unavailable.push({
                verbId: v.id,
                reason: 'Forma objetivo ausente en el ejemplo',
              });
              continue;
            }
            prompt = ex.sentence.replace(re, '____');
            accepted = ex.acceptedAnswers ?? [ex.targetForm];
            explanation = `${ex.sentence} — ${ex.translation}. ${ex.grammarPoint}.`;
          }
          const visualPrompt = prompt;
          if (mode === 'audio_detective') {
            audioText = t.variantValue;
            prompt = 'Escucha y escribe la forma que oyes.';
          }
          if (mode === 'quiz') {
            const distractors = [
              ...new Set(input.verbs.flatMap((x) => formValues(x, t.form))),
            ].filter((x) => !accepted.includes(x));
            if (distractors.length < 2) {
              result.unavailable.push({
                verbId: v.id,
                reason: 'Añade al menos tres verbos para crear opciones distintas.',
              });
              continue;
            }
            options = shuffle([accepted[0], ...shuffle(distractors, rng).slice(0, 3)], rng);
          }
          result.questions.push({
            id: `${v.id}:${skill}:${mode}:${t.id}:${createId()}`,
            version: '1',
            verbId: v.id,
            contentVersion: v.contentVersion,
            coverageVersion: learningRevision(v, skill),
            mode,
            skill,
            target: t.form,
            coverageTargetIds: [t.id],
            prompt,
            acceptedAnswers: accepted,
            options,
            explanation,
            audioText,
            visualPrompt,
            evidenceKind: mode === 'flashcards' ? 'self_report' : 'objective',
            isWritten: !options.length && mode !== 'flashcards',
          });
        }
      }
    }
  }
  return result;
}
