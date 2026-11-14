/** The small native surface we use, independent of experimental DOM typings. */
export interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: { readonly transcript: string };
}
export interface RecognitionResultEvent {
  resultIndex: number;
  results: { readonly length: number; readonly [index: number]: RecognitionResult };
}
export interface RecognitionEngine {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type RecognitionFactory = () => RecognitionEngine;
export type RecognitionState = 'preparing' | 'listening' | 'processing' | 'idle';
export interface RecognitionCallbacks {
  onState(state: RecognitionState): void;
  onFinal(alternatives: string[]): void;
  onInterim?(text: string): void;
  onIssue(message: string): void;
}
function browserFactory(): RecognitionFactory | null {
  if (typeof window === 'undefined' || window.isSecureContext === false) return null;
  const browser = window as unknown as {
    SpeechRecognition?: new () => RecognitionEngine;
    webkitSpeechRecognition?: new () => RecognitionEngine;
  };
  const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  return Constructor ? () => new Constructor() : null;
}
function issueMessage(error: string): string {
  if (error === 'not-allowed' || error === 'service-not-allowed')
    return 'No se ha concedido permiso al micrófono. Puedes responder con el teclado.';
  if (error === 'network') return 'El dictado necesita conexión. Puedes repetir o usar el teclado.';
  if (error === 'no-speech')
    return 'No se ha detectado voz. Puedes repetir o escribir tu respuesta.';
  return 'No se ha podido completar el dictado. Puedes repetir o usar el teclado.';
}
const MAX_ALTERNATIVES = 12;
const MAX_TRANSCRIPT_LENGTH = 1000;

export function createRecognitionController(factory: RecognitionFactory | null = browserFactory()) {
  let current: { engine: RecognitionEngine; cancel: () => void; stop: () => void } | null = null;
  function abort() {
    const capture = current;
    current = null;
    capture?.cancel();
  }
  return {
    supported: factory !== null,
    start(lang: string, callbacks: RecognitionCallbacks) {
      abort();
      if (!factory) {
        callbacks.onIssue('Este navegador no ofrece dictado. Puedes responder con el teclado.');
        callbacks.onState('idle');
        return;
      }
      let engine: RecognitionEngine;
      try {
        engine = factory();
      } catch {
        callbacks.onIssue(issueMessage('unavailable'));
        callbacks.onState('idle');
        return;
      }
      let active = true;
      let started = false;
      let stopRequested = false;
      let timer: ReturnType<typeof setTimeout>;
      const segments = new Map<number, string[]>();
      const draftSegments = new Map<number, string>();
      const cleanup = () => {
        active = false;
        clearTimeout(timer);
        engine.onstart = engine.onend = engine.onerror = engine.onresult = null;
        if (current?.engine === engine) current = null;
      };
      const stopEngine = (cancel: boolean) => {
        try {
          if (cancel) engine.abort();
          else engine.stop();
        } catch {
          /* Native engines can already be stopped. */
        }
      };
      const fail = (error: string) => {
        if (!active) return;
        cleanup();
        stopEngine(true);
        callbacks.onIssue(issueMessage(error));
        callbacks.onState('idle');
      };
      const deadline = (ms: number) => {
        clearTimeout(timer);
        timer = setTimeout(() => fail('timeout'), ms);
      };
      const requestStop = () => {
        if (!active || stopRequested) return;
        stopRequested = true;
        callbacks.onState('processing');
        // A permission prompt may still be open. onstart repeats stop when it resolves.
        stopEngine(false);
        if (started) deadline(10000);
      };
      current = {
        engine,
        stop: requestStop,
        cancel: () => {
          if (!active) return;
          cleanup();
          stopEngine(true);
          callbacks.onState('idle');
        },
      };
      engine.onstart = () => {
        if (!active) {
          stopEngine(true);
          return;
        }
        started = true;
        if (stopRequested) {
          stopEngine(false);
          deadline(10000);
        } else {
          callbacks.onState('listening');
          deadline(60000);
        }
      };
      engine.onresult = (event) => {
        if (!active) return;
        if (event.results.length > MAX_TRANSCRIPT_LENGTH) {
          fail('overflow');
          return;
        }
        const interim: string[] = [];
        for (let index = event.resultIndex; index < event.results.length; index++) {
          const result = event.results[index];
          if (result.length > MAX_ALTERNATIVES) {
            fail('overflow');
            return;
          }
          const texts = [
            ...new Set(
              Array.from({ length: result.length }, (_, i) => result[i].transcript.trim()).filter(
                Boolean,
              ),
            ),
          ];
          if (texts.some((text) => text.length > MAX_TRANSCRIPT_LENGTH)) {
            fail('overflow');
            return;
          }
          draftSegments.set(index, texts[0] ?? '');
          if (result.isFinal) segments.set(index, texts);
          else interim.push(texts[0] ?? '');
        }
        const finalLength = [...segments.values()].reduce(
          (total, texts) => total + Math.max(0, ...texts.map((text) => text.length)) + 1,
          0,
        );
        if (finalLength + interim.join(' ').length > MAX_TRANSCRIPT_LENGTH) {
          fail('overflow');
          return;
        }
        // Native results include earlier final segments; retain their positions in the
        // editable draft even when this event updates only a later result index.
        for (const index of draftSegments.keys()) {
          if (index >= event.results.length && !segments.has(index)) draftSegments.delete(index);
        }
        callbacks.onInterim?.(
          [...draftSegments]
            .sort(([a], [b]) => a - b)
            .map(([, text]) => text)
            .filter(Boolean)
            .join(' '),
        );
      };
      engine.onerror = (event) => fail(event.error);
      engine.onend = () => {
        if (!active) return;
        cleanup();
        let alternatives = [''];
        for (const [, texts] of [...segments].sort(([a], [b]) => a - b)) {
          if (texts.length) {
            if (alternatives.length * texts.length > MAX_ALTERNATIVES) {
              callbacks.onState('idle');
              callbacks.onIssue(
                'Hay varias interpretaciones. Revisa lo que he entendido o escribe tu respuesta.',
              );
              return;
            }
            alternatives = alternatives.flatMap((prefix) =>
              texts.map((text) => `${prefix} ${text}`.trim()),
            );
          }
        }
        const finals = [...new Set(alternatives.filter(Boolean))];
        callbacks.onState('idle');
        if (finals.length) callbacks.onFinal(finals);
        else callbacks.onIssue(issueMessage('no-speech'));
      };
      callbacks.onState('preparing');
      deadline(15000);
      try {
        engine.lang = lang;
        engine.interimResults = true;
        engine.maxAlternatives = 3;
        try {
          engine.continuous = true;
        } catch {
          /* Optional in some engines. */
        }
        // Keep this synchronous so native permission requests retain the user gesture.
        engine.start();
      } catch {
        fail('start');
      }
    },
    stop() {
      current?.stop();
    },
    abort,
  };
}
export type RecognitionController = ReturnType<typeof createRecognitionController>;
