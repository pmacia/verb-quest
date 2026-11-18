import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../app/app-context';
import type { InputMethod, ReviewDraft } from '../../shared/domain/types';
import { createRecognitionController, type RecognitionState } from '../audio/recognition-service';
import { resolveReviewCaptureMode } from '../audio/review-capture-mode';
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
  const captureMode = resolveReviewCaptureMode(settings.reviewCapture);
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
  const beforeDictation = useRef<ReviewDraft | null>(null);
  const controller = useMemo(() => createRecognitionController(), []);
  const [state, setState] = useState<RecognitionState>('idle');
  const [field, setField] = useState<number | undefined>();
  const [message, setMessage] = useState('');
  const [heard, setHeard] = useState('');
  const [canDiscard, setCanDiscard] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [captureUnavailable, setCaptureUnavailable] = useState(false);
  const alive = useRef(true);
  const sending = useRef(false);
  const generation = useRef(0);
  const warmingUp = useRef(false);
  const latest = useRef({ onSubmit, onReviewDraft });
  latest.current = { onSubmit, onReviewDraft };
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      abort();
    };
  }, [controller]);
  useEffect(() => {
    if (disabled || reviewFeedback) abort();
  }, [disabled, reviewFeedback, controller]);
  function abort() {
    generation.current++;
    if (warmingUp.current) {
      warmingUp.current = false;
      getSpeechService().cancel();
    }
    controller.abort();
    if (alive.current) setState('idle');
  }
  function store(next: ReviewDraft) {
    current.current = next;
    setDraft(next);
    latest.current.onReviewDraft?.(next);
  }
  async function check(value = current.current) {
    if (sending.current || disabled || reviewFeedback) return;
    abort();
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
    if (
      disabled ||
      reviewFeedback ||
      blocked ||
      !controller.supported ||
      warmingUp.current ||
      state !== 'idle'
    )
      return;
    const token = ++generation.current;
    setCaptureUnavailable(false);
    getSpeechService().cancel();
    const before = current.current;
    beforeDictation.current = before;
    setCanDiscard(true);
    const methods = before.fieldMethods ?? ['keyboard', 'keyboard', 'keyboard'];
    const captureMethods: InputMethod[] =
      index === undefined
        ? ['voice', 'voice', 'voice']
        : methods.map((method, i) => (i === index ? 'voice' : method));
    const automatic = (settings.reviewCheck ?? 'automatic') === 'automatic';
    setField(index);
    setHeard('');
    setMessage('');
    const callbacks = {
      onState: (value: RecognitionState) => {
        if (alive.current && generation.current === token) setState(value);
      },
      onInterim: (text: string) => {
        if (!alive.current || generation.current !== token || !text.trim()) return;
        setHeard(text);
        store({
          ...before,
          values: speechDraftValues(question, text, before.values, index),
          fieldMethods: captureMethods,
          inputMethod: overall(captureMethods),
        });
      },
      onFinal: (alternatives: string[]) => {
        if (!alive.current || generation.current !== token) return;
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
      onIssue: (text: string) => {
        if (alive.current && generation.current === token) {
          setMessage(text);
          setHeard('');
          setCaptureUnavailable(
            text.includes('no ha abierto el micrófono') || text.includes('no está enviando texto'),
          );
          if (text.includes('permiso')) setBlocked(true);
        }
      },
    };
    const launch = () =>
      controller.start(question.review?.dialect === 'us' ? 'en-US' : 'en-GB', callbacks, {
        continuous: captureMode === 'hold',
      });
    if (captureMode === 'hold') launch();
    else {
      warmingUp.current = true;
      setState('preparing');
      setMessage('Escucha «Tu turno» y después di las formas seguidas.');
      void getSpeechService()
        .play({
          text: 'Tu turno',
          language: 'es',
          voiceURI: settings.voiceURI,
          preferredDialect: settings.dialect,
          volume: settings.volume,
          rate: settings.rate,
        })
        .then((result) => {
          if (!alive.current || generation.current !== token) return;
          warmingUp.current = false;
          if (result.status === 'played') {
            setMessage('');
            launch();
          } else {
            setState('idle');
            setMessage(
              'No se ha podido preparar el dictado compatible. Puedes usar el micrófono del teclado.',
            );
            setCaptureUnavailable(true);
          }
        });
    }
  }
  function write(index: number, value: string) {
    setCaptureUnavailable(false);
    abort();
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
  function discard() {
    const previous = beforeDictation.current;
    if (!previous) return;
    abort();
    setMessage('Dictado descartado. Puedes volver a intentarlo.');
    setHeard('');
    store(previous);
    beforeDictation.current = null;
    setCanDiscard(false);
  }
  function suggest(index: number, value: string) {
    write(index, value);
    store({ ...current.current, assisted: true });
  }
  return {
    draft,
    state,
    captureMode,
    field,
    message,
    heard,
    supported: controller.supported,
    blocked,
    captureUnavailable,
    start,
    stop: () => controller.stop(),
    abort,
    write,
    suggest,
    discard,
    canDiscard,
    check: () => check(),
    unblock: () => setBlocked(false),
  };
}
