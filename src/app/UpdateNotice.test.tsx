import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { openAppDatabase } from '../features/persistence/repositories';
import { bootstrap } from '../features/persistence/bootstrap';
import { startSession } from '../features/learning-engine/session-service';
import { dataset } from '../../tests/fixtures/dataset';
import { UpdateNotice } from './UpdateNotice';
const state = vi.hoisted(() => ({
  app: {} as any,
  ready: () => {},
  activate: vi.fn(async () => {}),
}));
vi.mock('./app-context', () => ({ useApp: () => state.app }));
vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: any) => {
    state.ready = options.onNeedRefresh;
    return state.activate;
  },
}));
afterEach(() => {
  cleanup();
  state.activate.mockClear();
});
async function setup() {
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {} });
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  const repos = await openAppDatabase(crypto.randomUUID());
  const clock = { now: () => '2026-11-22T12:00:00Z' };
  const profile = await bootstrap(repos, dataset, clock);
  const session = await startSession(
    repos,
    {
      profileId: profile.id,
      kind: 'free',
      verbIds: ['buy'],
      modes: ['verb_review'],
      skills: ['recall'],
    },
    clock,
    () => 0.5,
  );
  state.app = { repos, refresh: vi.fn(async () => {}) };
  render(<UpdateNotice />);
  state.ready();
  fireEvent.click(await screen.findByRole('button', { name: 'Actualizar aplicación' }));
  await screen.findByRole('dialog', { name: 'Cerrar sesión y actualizar' });
  return { repos, session };
}
it('closes the active session before activating the update', async () => {
  const { repos, session } = await setup();
  expect(state.activate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión y actualizar' }));
  await waitFor(() => expect(state.activate).toHaveBeenCalledWith(true));
  expect((await repos.sessions.get(session.id))?.status).toBe('completed');
  repos.close();
});
it('keeps the session open when update confirmation is cancelled', async () => {
  const { repos, session } = await setup();
  fireEvent.click(screen.getByRole('button', { name: 'Seguir con mi sesión' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect((await repos.sessions.get(session.id))?.status).toBe('active');
  expect(state.activate).not.toHaveBeenCalled();
  repos.close();
});
