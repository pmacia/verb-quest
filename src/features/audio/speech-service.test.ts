import { it, expect } from 'vitest';
import { createSpeechService } from './speech-service';
const voice = { uri: 'uk', lang: 'en-GB', name: 'UK Voice', localService: true };
function port(voices = [voice], fail = false) {
  let changed = () => {};
  let end = () => {};
  return {
    getVoices: () => voices,
    onVoices: (fn: () => void) => {
      changed = fn;
      return () => {};
    },
    speak: (_request: any, callbacks: any) => {
      end = callbacks.end;
      if (fail) callbacks.error();
      else {
        callbacks.start();
        queueMicrotask(callbacks.end);
      }
    },
    pause() {},
    resume() {},
    cancel() {},
    change: () => changed(),
    finish: () => end(),
  };
}
const req = { text: 'went', voiceURI: null, preferredDialect: 'uk' as const, volume: 0.8, rate: 1 };
it('plays using the real selected voice and reports its dialect', async () => {
  const s = createSpeechService(port());
  expect(s.listVoices()).toEqual([voice]);
  expect(await s.play(req)).toMatchObject({ status: 'played', voice, fallback: false });
});
it('reports English voice substitution instead of silently relabeling US as UK', async () => {
  const s = createSpeechService(port([{ ...voice, uri: 'us', lang: 'en-US' }]));
  expect(await s.play(req)).toMatchObject({
    status: 'played',
    fallback: true,
    voice: { lang: 'en-US' },
  });
});
it('listens for late voice availability', () => {
  const voices: (typeof voice)[] = [];
  const p = port(voices);
  const s = createSpeechService(p);
  let count = 0;
  s.subscribeVoices(() => {
    count = s.listVoices().length;
  });
  voices.push(voice);
  p.change();
  expect(count).toBe(1);
});
it('returns failed when synthesis fails and unavailable when no voice exists', async () => {
  expect((await createSpeechService(port([voice], true)).play(req)).status).toBe('failed');
  expect((await createSpeechService(port([])).play(req)).status).toBe('unavailable');
});
it('cancellation never reports listening completion', async () => {
  const p = port();
  p.speak = () => {};
  const s = createSpeechService(p);
  const pending = s.play(req);
  s.cancel();
  expect((await pending).status).toBe('cancelled');
});
it('late callbacks from a cancelled utterance cannot complete a newer one', async () => {
  const callbacks: any[] = [];
  const p = port();
  p.speak = (_r, c) => {
    callbacks.push(c);
  };
  const s = createSpeechService(p);
  const first = s.play(req);
  const second = s.play(req);
  expect((await first).status).toBe('cancelled');
  callbacks[0].end();
  s.cancel();
  expect((await second).status).toBe('cancelled');
});
