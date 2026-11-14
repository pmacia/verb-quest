import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRecognitionController,
  type RecognitionEngine,
  type RecognitionResultEvent,
} from './recognition-service';

class Engine implements RecognitionEngine {
  lang = '';
  interimResults = false;
  continuous = false;
  maxAlternatives = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onresult: ((event: RecognitionResultEvent) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}
function setup() {
  const engine = new Engine();
  const callbacks = { onState: vi.fn(), onFinal: vi.fn(), onInterim: vi.fn(), onIssue: vi.fn() };
  const controller = createRecognitionController(() => engine);
  controller.start('en-GB', callbacks);
  return { engine, callbacks, controller };
}
const result = (isFinal: boolean, ...texts: string[]) =>
  Object.assign(
    texts.map((transcript) => ({ transcript })),
    { isFinal },
  );
afterEach(() => vi.useRealTimers());
describe('recognition controller', () => {
  it('starts synchronously with dialect and requests multiple alternatives', () => {
    const { engine } = setup();
    expect(engine.start).toHaveBeenCalledOnce();
    expect(engine).toMatchObject({ lang: 'en-GB', continuous: true, interimResults: true });
    expect(engine.maxAlternatives).toBeGreaterThanOrEqual(3);
  });
  it('retains final segments and legitimate repetitions, replacing updated result indexes', () => {
    const { engine, callbacks } = setup();
    engine.onstart?.();
    engine.onresult?.({
      resultIndex: 0,
      results: [result(true, 'buy', 'by'), result(false, 'bot')],
    });
    expect(callbacks.onFinal).not.toHaveBeenCalled();
    expect(callbacks.onInterim).toHaveBeenLastCalledWith('buy bot');
    engine.onresult?.({
      resultIndex: 1,
      results: [result(true, 'buy', 'by'), result(true, 'bought'), result(true, 'bought')],
    });
    engine.onresult?.({
      resultIndex: 1,
      results: [result(true, 'buy', 'by'), result(true, 'bought'), result(true, 'bought')],
    });
    expect(callbacks.onInterim).toHaveBeenLastCalledWith('buy bought bought');
    engine.onend?.();
    expect(callbacks.onFinal).toHaveBeenCalledExactlyOnceWith([
      'buy bought bought',
      'by bought bought',
    ]);
    expect(callbacks.onState).toHaveBeenLastCalledWith('idle');
  });
  it('stops a capture that starts after the pointer was released during permission', () => {
    const { engine, controller, callbacks } = setup();
    controller.stop();
    engine.onstart?.();
    expect(engine.stop).toHaveBeenCalled();
    expect(callbacks.onState).toHaveBeenLastCalledWith('processing');
  });
  it.each(['not-allowed', 'network', 'no-speech'])(
    'treats %s as an input issue without submitting final text',
    (error) => {
      const { engine, callbacks } = setup();
      engine.onresult?.({ resultIndex: 0, results: [result(true, 'buy bought bought')] });
      engine.onerror?.({ error });
      engine.onend?.();
      expect(callbacks.onIssue).toHaveBeenCalledOnce();
      expect(callbacks.onFinal).not.toHaveBeenCalled();
      expect(callbacks.onState).toHaveBeenLastCalledWith('idle');
    },
  );
  it('invalidates late events after abort, including events from an earlier capture', () => {
    const { engine, controller, callbacks } = setup();
    const lateResult = engine.onresult;
    const lateEnd = engine.onend;
    controller.abort();
    lateResult?.({ resultIndex: 0, results: [result(true, 'buy bought bought')] });
    lateEnd?.();
    expect(callbacks.onFinal).not.toHaveBeenCalled();
    expect(engine.abort).toHaveBeenCalled();
  });
  it('times out startup and completion stalls without grading', () => {
    vi.useFakeTimers();
    const { engine, callbacks } = setup();
    vi.advanceTimersByTime(120000);
    expect(engine.abort).toHaveBeenCalled();
    expect(callbacks.onIssue).toHaveBeenCalledOnce();
    expect(callbacks.onFinal).not.toHaveBeenCalled();
  });
  it('times out a stopped engine that never finishes', () => {
    vi.useFakeTimers();
    const { engine, controller, callbacks } = setup();
    engine.onstart?.();
    controller.stop();
    vi.advanceTimersByTime(10001);
    expect(callbacks.onState).toHaveBeenLastCalledWith('idle');
    expect(callbacks.onFinal).not.toHaveBeenCalled();
    expect(callbacks.onIssue).toHaveBeenCalledOnce();
  });
  it('rejects events from a replaced capture and submits the new capture only once', () => {
    const first = new Engine();
    const second = new Engine();
    const factory = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const controller = createRecognitionController(factory);
    const callbacks = { onState: vi.fn(), onFinal: vi.fn(), onIssue: vi.fn() };
    controller.start('en-GB', callbacks);
    const oldResult = first.onresult;
    const oldEnd = first.onend;
    controller.start('en-US', callbacks);
    oldResult?.({ resultIndex: 0, results: [result(true, 'old')] });
    oldEnd?.();
    second.onresult?.({ resultIndex: 0, results: [result(true, 'new')] });
    const end = second.onend;
    end?.();
    end?.();
    expect(callbacks.onFinal).toHaveBeenCalledExactlyOnceWith(['new']);
    expect(second.lang).toBe('en-US');
  });
  it('requests review without final grading when distinct combinations exceed the bound', () => {
    const { engine, callbacks } = setup();
    engine.onresult?.({
      resultIndex: 0,
      results: Array.from({ length: 8 }, () => result(true, 'a', 'b', 'c')),
    });
    engine.onend?.();
    expect(callbacks.onFinal).not.toHaveBeenCalled();
    expect(callbacks.onIssue).toHaveBeenCalledExactlyOnceWith(
      'Hay varias interpretaciones. Revisa lo que he entendido o escribe tu respuesta.',
    );
    expect(callbacks.onInterim).toHaveBeenLastCalledWith('a a a a a a a a');
    expect(callbacks.onState).toHaveBeenLastCalledWith('idle');
  });
  it('deduplicates alternatives within each segment without discarding disagreement or repeated words', () => {
    const { engine, callbacks } = setup();
    engine.onresult?.({
      resultIndex: 0,
      results: [
        result(true, 'buy', 'by', 'wrong'),
        result(true, 'bought', 'bought', 'bought'),
        result(true, 'bought', 'bought', 'bought'),
      ],
    });
    engine.onend?.();
    expect(callbacks.onFinal).toHaveBeenCalledExactlyOnceWith([
      'buy bought bought',
      'by bought bought',
      'wrong bought bought',
    ]);
  });
  it.each([true, false])('rejects oversized final=%s transcripts without grading', (isFinal) => {
    const { engine, callbacks } = setup();
    engine.onresult?.({ resultIndex: 0, results: [result(isFinal, 'a'.repeat(1001))] });
    engine.onend?.();
    expect(callbacks.onIssue).toHaveBeenCalledOnce();
    expect(callbacks.onFinal).not.toHaveBeenCalled();
    expect(engine.abort).toHaveBeenCalledOnce();
  });
  it('rejects a capture whose accumulated final segments exceed the text limit', () => {
    const { engine, callbacks } = setup();
    const segments = [result(true, 'a'.repeat(600)), result(true, 'b'.repeat(600))];
    engine.onresult?.({ resultIndex: 0, results: segments.slice(0, 1) });
    engine.onresult?.({ resultIndex: 1, results: segments });
    engine.onend?.();
    expect(callbacks.onIssue).toHaveBeenCalledOnce();
    expect(callbacks.onFinal).not.toHaveBeenCalled();
  });
  it('reports unsupported recognition as a recoverable issue', () => {
    const callbacks = { onState: vi.fn(), onFinal: vi.fn(), onIssue: vi.fn() };
    const controller = createRecognitionController(null);
    expect(controller.supported).toBe(false);
    controller.start('en-US', callbacks);
    expect(callbacks.onIssue).toHaveBeenCalledOnce();
  });
});
