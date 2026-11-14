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
  be: ['bee'],
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
  const candidates = alternatives
    .slice(0, 12)
    .map((text) => speechDraftValues(question, text, values, field));
  const evaluations = candidates.map((answer) =>
    evaluateReview(question, { answer, fieldMethods }),
  );
  const keys = new Set(
    evaluations.map((result) => JSON.stringify(result.columns.map((column) => column.canonical))),
  );
  const automatic =
    alternatives.length <= 12 &&
    evaluations.length > 0 &&
    evaluations.every((result) => result.correct) &&
    keys.size === 1;
  return {
    automatic,
    values: automatic
      ? evaluations[0].columns.map((column) => column.canonical)
      : (candidates[0] ?? values),
    fieldMethods,
  };
}
export function reviewSuggestion(
  question: Question,
  value: string,
  index: number,
  knownForms: string[] = [],
): string | undefined {
  const token = normalizeReview(value);
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
