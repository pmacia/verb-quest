import type {
  AnswerInput,
  Dialect,
  FormKey,
  InputMethod,
  Question,
  Verb,
} from '../../shared/domain/types';
import { createId } from '../../shared/identity/create-id';
import { getCoverageTargets } from './coverage';
import { learningRevision } from './revision';
export const reviewFormLabels = ['Infinitivo', 'Pasado', 'Participio'];
export const reviewForms: FormKey[] = ['base', 'pastSimple', 'pastParticiple'];
export function makeReviewQuestion(
  verb: Verb,
  dialect: Dialect,
  language: 'es' | 'en',
): Question | null {
  const targets = getCoverageTargets(verb, 'recall', dialect);
  const forms = reviewForms.map((form) => ({
    form,
    answers: (form === 'base'
      ? [verb.forms.base]
      : verb.forms[form].variants.filter(
          (v) => !v.dialect || v.dialect === 'all' || v.dialect === dialect,
        )
    ).map((variant) => ({
      value: variant.value,
      coverageTargetIds: targets
        .filter((t) => t.form === form && (!t.contextKey || t.variantValue === variant.value))
        .map((t) => t.id),
    })),
  }));
  if (forms.some((f) => !f.answers.length || f.answers.some((a) => !a.coverageTargetIds.length)))
    return null;
  return {
    id: createId(),
    version: '1',
    verbId: verb.id,
    contentVersion: verb.contentVersion,
    coverageVersion: learningRevision(verb, 'recall'),
    mode: 'verb_review',
    skill: 'recall',
    target: 'base',
    coverageTargetIds: targets
      .filter((t) => language !== 'en' || t.form !== 'base')
      .map((t) => t.id),
    prompt: language === 'en' ? verb.forms.base.value : verb.meanings.join(' · '),
    acceptedAnswers: [verb.forms.base.value],
    options: [],
    evidenceKind: 'objective',
    isWritten: true,
    explanation: forms.map((f) => f.answers.map((a) => a.value).join(' / ')).join(' → '),
    review: { dialect, language, forms },
  };
}
export const normalizeReview = (value: string) =>
  value
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,!?;:"()[\]{}·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const homophones: Record<string, string[]> = {
  buy: ['by', 'bye'],
  be: ['bee', 'b'],
  been: ['bean', 'bin'],
  write: ['right', 'rite'],
  wrote: ['rote'],
  know: ['no'],
  knew: ['new'],
  see: ['sea'],
  seen: ['scene'],
  hear: ['here'],
  heard: ['herd'],
  meet: ['meat'],
  made: ['maid'],
  won: ['one'],
  ate: ['eight'],
  threw: ['through'],
  flown: [],
  flew: ['flu', 'flue'],
  blew: ['blue'],
  thrown: ['throne'],
  led: ['lead'],
};
function matchSpoken(value: string, expected: string, form: FormKey, method: InputMethod) {
  const target = normalizeReview(expected);
  if (value === target) return true;
  if (method === 'keyboard') return false;
  // Only join a short split transcription when it spells the expected form exactly.
  if (value.split(' ').length <= 3 && value.replace(/ /g, '') === target) return true;
  return (
    target === 'read' ? (form === 'base' ? ['reed'] : ['red']) : (homophones[target] ?? [])
  ).includes(value);
}
export function evaluateReview(
  question: Question,
  input: Pick<AnswerInput, 'answer' | 'inputMethod' | 'fieldMethods'>,
) {
  const values = Array.isArray(input.answer) ? input.answer : [];
  const columns = (question.review?.forms ?? []).map((form, index) => {
    const value = normalizeReview(values[index] ?? '');
    const method = input.fieldMethods?.[index] ?? input.inputMethod ?? 'keyboard';
    const direct = form.answers.find((answer) =>
      matchSpoken(value, answer.value, form.form, method),
    );
    const parts = value.split(/\s*(?:\/|\||\bor\b)\s*|\s+/).filter(Boolean);
    const matches = direct
      ? [direct]
      : parts.map((part) =>
          form.answers.find((answer) => matchSpoken(part, answer.value, form.form, method)),
        );
    const correct =
      !!value &&
      (direct !== undefined ||
        (parts.length > 1 && new Set(parts).size === parts.length && matches.every(Boolean)));
    return {
      correct,
      value: values[index] ?? '',
      canonical: correct ? matches.map((a) => a!.value).join(' / ') : value,
      accepted: form.answers.map((a) => a.value),
      targetIds: correct ? matches.flatMap((a) => a!.coverageTargetIds) : [],
    };
  });
  const correct =
    values.length === 3 && columns.length === 3 && columns.every((column) => column.correct);
  return {
    correct,
    columns,
    coverageTargetIds: correct
      ? [
          ...new Set(
            columns.flatMap((column, index) =>
              question.review?.language === 'en' && index === 0 ? [] : column.targetIds,
            ),
          ),
        ]
      : [],
  };
}
function splitSpeech(text: string, question: Question): string[] {
  const tokens = normalizeReview(text).split(' ').filter(Boolean);
  if (
    tokens.length === 4 &&
    question.review?.forms[0].answers[0]?.value === 'be' &&
    tokens.slice(1, 3).every((token) => ['was', 'were'].includes(token)) &&
    tokens[1] !== tokens[2]
  )
    return [tokens[0], `${tokens[1]} / ${tokens[2]}`, tokens[3]];
  if (tokens.length <= 3) return Array.from({ length: 3 }, (_, i) => tokens[i] ?? '');
  // Try every bounded three-column partition. Consume ALL tokens; never search
  // for the expected words inside an otherwise unrelated utterance.
  if (tokens.length <= 9) {
    const candidates: { values: string[]; score: number }[] = [];
    for (let first = 1; first < tokens.length; first++)
      for (let second = first + 1; second < tokens.length; second++) {
        const values = [
          tokens.slice(0, first).join(' '),
          tokens.slice(first, second).join(' '),
          tokens.slice(second).join(' '),
        ];
        if (values.some((value) => value.split(' ').length > 3)) continue;
        const evaluation = evaluateReview(question, { answer: values, inputMethod: 'voice' });
        const score = evaluation.columns.reduce(
          (total, column, index) =>
            total + (column.correct ? 0 : reviewSuggestion(question, values[index], index) ? 1 : 5),
          0,
        );
        candidates.push({ values, score });
      }
    candidates.sort((a, b) => a.score - b.score);
    if (candidates[0]?.score < 5 && candidates[0].score < (candidates[1]?.score ?? Infinity))
      return candidates[0].values;
  }
  return [text, '', ''];
}
export function speechDraftValues(
  question: Question,
  text: string,
  values: string[],
  field?: number,
): string[] {
  return field === undefined
    ? splitSpeech(text, question)
    : values.map((value, index) => (index === field ? normalizeReview(text) : value));
}
export function resolveReviewSpeech(
  question: Question,
  alternatives: string[],
  values: string[] = ['', '', ''],
  field?: number,
  methods: InputMethod[] = ['keyboard', 'keyboard', 'keyboard'],
) {
  const fieldMethods: InputMethod[] =
    field === undefined
      ? ['voice', 'voice', 'voice']
      : methods.map((method, index) => (index === field ? 'voice' : method));
  // The first transcript is the answer shown to the learner. Check that same
  // answer, rather than vetoing it because of unused secondary interpretations.
  const displayed = alternatives.length
    ? speechDraftValues(question, alternatives[0], values, field)
    : values;
  const evaluation = evaluateReview(question, { answer: displayed, fieldMethods });
  const automatic = alternatives.length > 0 && alternatives.length <= 12 && evaluation.correct;
  return {
    automatic,
    values: automatic ? evaluation.columns.map((column) => column.canonical) : displayed,
    fieldMethods,
    suggestions: displayed.map((value, index) => {
      if (fieldMethods[index] === 'keyboard' || evaluation.columns[index]?.correct)
        return undefined;
      const options = new Set<string>();
      const suggestion = recognitionConfusion(question, value, index);
      if (suggestion) options.add(suggestion);
      for (const alternative of alternatives.slice(1, 12)) {
        const candidate = speechDraftValues(question, alternative, values, field);
        const checked = evaluateReview(question, { answer: candidate, fieldMethods });
        if (checked.correct) options.add(checked.columns[index].canonical);
      }
      return options.size === 1 ? [...options][0] : undefined;
    }),
  };
}
export function reviewSuggestion(
  question: Question,
  value: string,
  index: number,
  knownForms: string[] = [],
): string | undefined {
  const token = normalizeReview(value);
  const confusion = recognitionConfusion(question, value, index);
  if (confusion) return confusion;
  if (
    token.length < 4 ||
    knownForms.some((form) => normalizeReview(form) === token) ||
    question.review?.forms.some((form) =>
      form.answers.some((a) => normalizeReview(a.value) === token),
    )
  )
    return undefined;
  const distance = (a: string, b: string) => {
    let row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const next = [i];
      for (let j = 1; j <= b.length; j++)
        next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + Number(a[i - 1] !== b[j - 1]));
      row = next;
    }
    return row[b.length];
  };
  const matches =
    question.review?.forms[index].answers.filter(
      (answer) => distance(token, normalizeReview(answer.value)) === 1,
    ) ?? [];
  return matches.length === 1 ? matches[0].value : undefined;
}

function recognitionConfusion(question: Question, value: string, index: number) {
  // Different English words: confirmation only, never an automatic equivalence.
  if (
    normalizeReview(value) === 'being' &&
    question.review?.forms[index]?.answers.some((a) => a.value === 'been')
  )
    return 'been';
  return undefined;
}
