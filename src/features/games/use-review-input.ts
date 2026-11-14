import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../app/app-context';
import type { InputMethod, ReviewDraft } from '../../shared/domain/types';
import { createRecognitionController, type RecognitionState } from '../audio/recognition-service';
import { getSpeechService } from '../audio/speech-service';
import { resolveReviewSpeech, speechDraftValues } from '../question-engine/verb-review';
import type { GameProps } from './exercises';
const overall = (methods: InputMethod[]): InputMethod =>
  methods.every((m) => m === 'keyboard')
    ? 'keyboard'
    : methods.every((m) => m === 'voice')
      ? 'voice'
      : 'mixed';
export function useReviewInput(props: GameProps) {
  const { settings } = useApp();
  const { question, onSubmit, disabled, reviewFeedback, onReviewDraft } = props;
  const [draft, setDraft] = useState<ReviewDraft>(
    () =>
      props.reviewDraft ?? {
        questionId: question.id,
        values: ['', '', ''],
        inputMethod: 'keyboard',
        fieldMethods: ['keyboard', 'keyboard', 'keyboard'],
        assisted: false,
      },
  );
  const current = useRef(draft);
  const controller = useMemo(() => createRecognitionController(), []);
  const [state, setState] = useState<RecognitionState>('idle');
  const [field, setField] = useState<number | undefined>();
  const [message, setMessage] = useState('');
  const [heard, setHeard] = useState('');
  const [blocked, setBlocked] = useState(false);
  const alive = useRef(true);
  const sending = useRef(false);
  const latest = useRef({ onSubmit, onReviewDraft });
  latest.current = { onSubmit, onReviewDraft };
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.abort();
    };
  }, [controller]);
  useEffect(() => {
    if (disabled || reviewFeedback) controller.abort();
  }, [disabled, reviewFeedback, controller]);
  function store(next: ReviewDraft) {
    current.current = next;
    setDraft(next);
    latest.current.onReviewDraft?.(next);
  }
  async function check(value = current.current) {
    if (sending.current || disabled || reviewFeedback) return;
    controller.abort();
    sending.current = true;
    try {
      await latest.current.onSubmit({
        answer: value.values,
        inputMethod: value.inputMethod,
        fieldMethods: value.fieldMethods,
        voiceConfirmed: true,
        hintsUsed: value.assisted,
        revealed: false,
      });
    } finally {
      sending.current = false;
    }
  }
  function start(index?: number) {
    if (disabled || reviewFeedback || blocked || !controller.supported) return;
    getSpeechService().cancel();
    const before = current.current;
    const methods = before.fieldMethods ?? ['keyboard', 'keyboard', 'keyboard'];
    const captureMethods: InputMethod[] =
      index === undefined
        ? ['voice', 'voice', 'voice']
        : methods.map((method, i) => (i === index ? 'voice' : method));
    const automatic = (settings.reviewCheck ?? 'automatic') === 'automatic';
    setField(index);
    setHeard('');
    setMessage('');
    controller.start(question.review?.dialect === 'us' ? 'en-US' : 'en-GB', {
      onState: (value) => {
        if (alive.current) setState(value);
      },
      onInterim: (text) => {
        if (!alive.current || !text.trim()) return;
        setHeard(text);
        store({
          ...before,
          values: speechDraftValues(question, text, before.values, index),
          fieldMethods: captureMethods,
          inputMethod: overall(captureMethods),
        });
      },
      onFinal: (alternatives) => {
        if (!alive.current) return;
        const result = resolveReviewSpeech(question, alternatives, before.values, index, methods);
        const next = {
          ...before,
          values: result.values,
          fieldMethods: result.fieldMethods,
          inputMethod: overall(result.fieldMethods),
        };
        store(next);
        setHeard('');
        if (result.automatic && automatic) {
          setMessage('Respuesta reconocida.');
          void check(next);
        } else
          setMessage(
            result.automatic
              ? 'Revisa las tres formas y pulsa Comprobar.'
              : 'Revisa lo que he entendido. Puedes repetir, editar o comprobar tu respuesta.',
          );
      },
      onIssue: (text) => {
        if (alive.current) {
          setMessage(text);
          setHeard('');
          if (text.includes('permiso')) setBlocked(true);
        }
      },
    });
  }
  function write(index: number, value: string) {
    controller.abort();
    setMessage('');
    setHeard('');
    const before = current.current;
    const methods = (before.fieldMethods ?? ['keyboard', 'keyboard', 'keyboard']).map(
      (method, i): InputMethod =>
        i === index ? (method === 'keyboard' ? 'keyboard' : 'mixed') : method,
    );
    store({
      ...before,
      values: before.values.map((text, i) => (i === index ? value : text)),
      fieldMethods: methods,
      inputMethod: overall(methods),
    });
  }
  function suggest(index: number, value: string) {
    write(index, value);
    store({ ...current.current, assisted: true });
  }
  return {
    draft,
    state,
    field,
    message,
    heard,
    supported: controller.supported,
    blocked,
    start,
    stop: () => controller.stop(),
    abort: () => controller.abort(),
    write,
    suggest,
    check: () => check(),
    unblock: () => setBlocked(false),
  };
}
