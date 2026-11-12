import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppContext, type AppData } from '../../app/app-context';
import { AudioControls } from './AudioControls';
import * as speech from './speech-service';

let spoken: string[];
let cancellations: number;
beforeEach(() => {
  spoken = [];
  cancellations = 0;
  const service = speech.createSpeechService({
    getVoices: () => [{ uri: 'uk', lang: 'en-GB', name: 'English', localService: true }],
    onVoices: () => () => {},
    speak: (request, callbacks) => {
      spoken.push(request.text);
      callbacks.start();
    },
    pause() {},
    resume() {},
    cancel() {
      cancellations++;
    },
  });
  vi.spyOn(speech, 'getSpeechService').mockReturnValue(service);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const app = {
  settings: { dialect: 'uk', voiceURI: null, volume: 1, rate: 1, showTechnicalDetails: false },
} as AppData;
function controls(text: string, autoPlay = false) {
  return (
    <AppContext.Provider value={app}>
      <AudioControls text={text} label="Escuchar solución" iconOnly autoPlay={autoPlay} />
    </AppContext.Provider>
  );
}
it('speaks a revealed solution automatically and allows stopping and replaying', async () => {
  render(controls('went', true));
  expect(spoken).toEqual(['went']);
  await userEvent.click(screen.getByRole('button', { name: 'Detener audio' }));
  await userEvent.click(screen.getByRole('button', { name: 'Escuchar solución' }));
  expect(spoken).toEqual(['went', 'went']);
});
it('does not play before requested and stops playback when the solution is removed', async () => {
  const view = render(controls('gone'));
  expect(spoken).toEqual([]);
  await userEvent.click(screen.getByRole('button', { name: 'Escuchar solución' }));
  expect(spoken).toEqual(['gone']);
  const before = cancellations;
  view.unmount();
  expect(cancellations).toBeGreaterThan(before);
});
it('does not replay a solution on ordinary rerenders', () => {
  const view = render(controls('went', true));
  view.rerender(controls('went', true));
  expect(spoken).toEqual(['went']);
});

it('keeps playback controls available after StrictMode checks cancel the first playback', async () => {
  render(<StrictMode>{controls('went', true)}</StrictMode>);
  await act(async () => {});
  expect(screen.getByRole('button', { name: 'Detener audio' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Escuchar solución' })).toBeDisabled();
});
