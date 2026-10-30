import { it, expect, vi } from 'vitest';
import { dataset } from '../../content/dataset';
import { createSpeechService, type SpeechPort } from './speech-service';
import { createVerbAudioPlayer, getVerbAudioSegments } from './verb-audio';
const settings = { dialect: 'uk' as const, voiceURI: null, volume: 0.7, rate: 0.8 };
const segments = [
  { form: 'base' as const, text: 'go' },
  { form: 'pastSimple' as const, text: 'went' },
  { form: 'pastParticiple' as const, text: 'gone' },
];
function controlled() {
  const requests: { text: string; volume: number; rate: number }[] = [];
  const callbacks: { start: () => void; end: () => void; error: () => void }[] = [];
  const port: SpeechPort = {
    getVoices: () => [{ uri: 'uk', lang: 'en-GB', name: 'UK Voice', localService: true }],
    onVoices: () => () => {},
    speak: (r, c) => {
      requests.push(r);
      callbacks.push(c);
      c.start();
    },
    cancel: vi.fn(),
    pause() {},
    resume() {},
  };
  return { requests, callbacks, port, player: createVerbAudioPlayer(createSpeechService(port)) };
}
it('builds the three forms in order without dropping be variants', () => {
  expect(
    getVerbAudioSegments(
      dataset.verbs.find((v) => v.id === 'be')!,
      'uk',
    ),
  ).toEqual([
    { form: 'base', text: 'be' },
    { form: 'pastSimple', text: 'was, were' },
    { form: 'pastParticiple', text: 'been' },
  ]);
});
it('uses reviewed contextual sentences for read and rejects missing reviewed context', () => {
  const read = dataset.verbs.find((v) => v.id === 'read')!;
  expect(getVerbAudioSegments(read, 'uk')).toEqual(
    ['base', 'pastSimple', 'pastParticiple'].map((form) => ({
      form,
      text: read.examples.find((e) => e.form === form)!.sentence,
    })),
  );
  expect(() => getVerbAudioSegments({ ...read, examples: [] }, 'uk')).toThrow(/read/);
});
it('waits for each end event, forwards preferences and records only completed forms', async () => {
  const c = controlled(),
    completed = vi.fn();
  const result = c.player.play(segments, settings, { onCompleted: completed });
  expect(c.requests.map((r) => r.text)).toEqual(['go']);
  expect(completed).not.toHaveBeenCalled();
  c.callbacks[0].end();
  await vi.waitFor(() => expect(c.requests).toHaveLength(2));
  expect(completed).toHaveBeenCalledWith('base');
  c.callbacks[1].end();
  await vi.waitFor(() => expect(c.requests).toHaveLength(3));
  c.callbacks[2].end();
  expect((await result).status).toBe('played');
  expect(completed.mock.calls.map((c) => c[0])).toEqual(['base', 'pastSimple', 'pastParticiple']);
  expect(c.requests.every((r) => r.volume === 0.7 && r.rate === 0.8)).toBe(true);
});
it('switching verbs cancels the old sequence even if its last callback arrives late', async () => {
  const c = controlled(),
    completed = vi.fn();
  const old = c.player.play(segments, settings, { onCompleted: completed });
  const next = c.player.play([{ form: 'base', text: 'take' }], settings, {
    onCompleted: completed,
  });
  c.callbacks[0].end();
  expect((await old).status).toBe('cancelled');
  expect(c.requests.map((r) => r.text)).toEqual(['go', 'take']);
  c.callbacks[1].end();
  expect((await next).status).toBe('played');
  expect(completed).toHaveBeenCalledTimes(1);
});
it('cancelling while activity is saved cannot resume the remaining forms', async () => {
  const c = controlled();
  let release!: () => void;
  const saved = new Promise<void>((r) => (release = r));
  const completed = vi.fn(() => saved);
  const pending = c.player.play(segments, settings, { onCompleted: completed });
  c.callbacks[0].end();
  await vi.waitFor(() => expect(completed).toHaveBeenCalledOnce());
  c.player.cancel();
  release();
  expect((await pending).status).toBe('cancelled');
  expect(c.requests).toHaveLength(1);
});
it('speech failure stops the sequence and never awards unfinished forms', async () => {
  const c = controlled(),
    completed = vi.fn();
  const pending = c.player.play(segments, settings, { onCompleted: completed });
  c.callbacks[0].error();
  expect((await pending).status).toBe('failed');
  expect(c.requests).toHaveLength(1);
  expect(completed).not.toHaveBeenCalled();
});
