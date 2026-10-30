export interface VoiceInfo {
  uri: string;
  lang: string;
  name: string;
  localService: boolean;
}
export interface SpeechRequest {
  text: string;
  voiceURI: string | null;
  preferredDialect: 'uk' | 'us';
  volume: number;
  rate: number;
}
export interface SpeechPort {
  getVoices(): VoiceInfo[];
  onVoices(fn: () => void): () => void;
  speak(
    request: SpeechRequest & { voice: VoiceInfo },
    callbacks: { start: () => void; end: () => void; error: () => void },
  ): void;
  pause(): void;
  resume(): void;
  cancel(): void;
}
export interface SpeechResult {
  status: 'played' | 'unavailable' | 'failed' | 'cancelled';
  voice?: VoiceInfo;
  fallback?: boolean;
}
export function createSpeechService(port: SpeechPort) {
  let serial = 0;
  let finish: ((r: SpeechResult) => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();
  port.onVoices(() => listeners.forEach((fn) => fn()));
  function done(result: SpeechResult) {
    if (timer) clearTimeout(timer);
    timer = null;
    const f = finish;
    finish = null;
    f?.(result);
  }
  const listVoices = () => port.getVoices().filter((v) => /^en(?:-|$)/i.test(v.lang));
  return {
    listVoices,
    subscribeVoices(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    play(request: SpeechRequest): Promise<SpeechResult> {
      const token = ++serial;
      done({ status: 'cancelled' });
      port.cancel();
      const settle = (result: SpeechResult) => {
        if (token === serial) done(result);
      };
      const voices = listVoices();
      const preferred = request.preferredDialect === 'uk' ? 'en-GB' : 'en-US';
      const voice =
        voices.find((v) => v.uri === request.voiceURI) ||
        voices.find((v) => v.lang.toLowerCase() === preferred.toLowerCase()) ||
        voices[0];
      if (!voice) return Promise.resolve({ status: 'unavailable' });
      return new Promise((resolve) => {
        finish = resolve;
        const fallback = voice.lang.toLowerCase() !== preferred.toLowerCase();
        timer = setTimeout(() => settle({ status: 'failed', voice, fallback }), 15000);
        try {
          port.speak(
            { ...request, voice },
            {
              start: () => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => settle({ status: 'failed', voice, fallback }), 60000);
              },
              end: () => settle({ status: 'played', voice, fallback }),
              error: () => settle({ status: 'failed', voice, fallback }),
            },
          );
        } catch {
          settle({ status: 'failed', voice, fallback });
        }
      });
    },
    pause() {
      port.pause();
    },
    resume() {
      port.resume();
    },
    cancel() {
      serial++;
      port.cancel();
      done({ status: 'cancelled' });
    },
  };
}
export type SpeechService = ReturnType<typeof createSpeechService>;
export function browserSpeechPort(): SpeechPort {
  const synth =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  return {
    getVoices: () =>
      synth
        ?.getVoices()
        .map((v) => ({
          uri: v.voiceURI,
          lang: v.lang,
          name: v.name,
          localService: v.localService,
        })) ?? [],
    onVoices(fn) {
      synth?.addEventListener('voiceschanged', fn);
      return () => synth?.removeEventListener('voiceschanged', fn);
    },
    speak(req, cb) {
      if (!synth) {
        cb.error();
        return;
      }
      const u = new SpeechSynthesisUtterance(req.text);
      u.voice = synth.getVoices().find((v) => v.voiceURI === req.voice.uri) ?? null;
      u.lang = req.voice.lang;
      u.volume = req.volume;
      u.rate = req.rate;
      u.onstart = cb.start;
      u.onend = cb.end;
      u.onerror = cb.error;
      synth.speak(u);
    },
    pause: () => synth?.pause(),
    resume: () => synth?.resume(),
    cancel: () => synth?.cancel(),
  };
}
let singleton: SpeechService | undefined;
export function getSpeechService() {
  return (singleton ??= createSpeechService(browserSpeechPort()));
}
