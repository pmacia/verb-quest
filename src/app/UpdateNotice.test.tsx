import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { openAppDatabase } from '../features/persistence/repositories';
import { bootstrap } from '../features/persistence/bootstrap';
import {
  pauseSession,
  replaceSession,
  startSession,
  submitAnswer,
  type SessionRequest,
} from '../features/learning-engine/session-service';
import { dataset } from '../../tests/fixtures/dataset';
import { UpdateNotice } from './UpdateNotice';
import type { AppData } from './app-context';
const state = vi.hoisted(() => ({
  app: null as Pick<AppData, 'repos' | 'refresh'> | null,
  ready: () => {},
  activate: vi.fn(async () => {}),
  prepare: vi.fn<() => Promise<() => Promise<void>>>(),
}));
vi.mock('./app-context', () => ({ useApp: () => state.app }));
vi.mock('./pwa', () => ({
  registerAppUpdates: (onUpdateReady: () => void) => {
    state.ready = onUpdateReady;
    return () => {};
  },
  prepareAppUpdate: state.prepare,
}));
afterEach(() => {
  cleanup();
  state.activate.mockReset();
  state.prepare.mockReset();
  for (const repos of connections.splice(0)) repos.close();
});
const connections: Awaited<ReturnType<typeof openAppDatabase>>[] = [];
const clock = { now: () => '2026-11-22T12:00:00Z' };
function study(profileId: string): SessionRequest {
  return {
    profileId,
    kind: 'free',
    verbIds: ['be', 'go', 'buy'],
    modes: ['written_recall'],
    skills: ['recall'],
  };
}
async function connect(name: string) {
  const repos = await openAppDatabase(name);
  connections.push(repos);
  return repos;
}
async function setup({ answered = false } = {}) {
  state.prepare.mockResolvedValue(state.activate);
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  const name = crypto.randomUUID();
  const repos = await connect(name);
  const profile = await bootstrap(repos, dataset, clock);
  const session = await startSession(repos, study(profile.id), clock, () => 0.5);
  if (answered) {
    expect(session.queue.length).toBeGreaterThan(1);
    const question = session.queue[0];
    await submitAnswer(
      repos,
      {
        attemptId: crypto.randomUUID(),
        sessionId: session.id,
        questionId: question.id,
        answer: question.acceptedAnswers[0],
        hintsUsed: false,
        revealed: false,
        at: clock.now(),
      },
      clock,
    );
  }
  const refresh = vi.fn<() => Promise<void>>(async () => {});
  state.app = { repos, refresh };
  render(<UpdateNotice />);
  state.ready();
  fireEvent.click(await screen.findByRole('button', { name: 'Actualizar aplicación' }));
  await screen.findByRole('dialog', { name: 'Cerrar sesión y actualizar' });
  return { name, repos, session, profile, refresh };
}
it('closes the active session before activating the update', async () => {
  const { repos, session } = await setup();
  expect(state.activate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión y actualizar' }));
  await waitFor(() => expect(state.activate).toHaveBeenCalledOnce());
  expect((await repos.sessions.get(session.id))?.status).toBe('completed');
});
it('keeps the session open when update confirmation is cancelled', async () => {
  const { repos, session } = await setup();
  fireEvent.click(screen.getByRole('button', { name: 'Seguir con mi sesión' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect((await repos.sessions.get(session.id))?.status).toBe('active');
  expect(state.activate).not.toHaveBeenCalled();
});

it('rolls back a failed close before requesting worker activation', async () => {
  const { repos, session } = await setup({ answered: true });
  const before = await repos.sessions.get(session.id);
  const attempts = await repos.attempts.toArray();
  const progress = await repos.progress.toArray();
  const xp = await repos.xpLedger.toArray();
  repos.xpLedger.hook('creating', () => {
    throw Error('No se pudo guardar el cierre');
  });

  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión y actualizar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar el cierre');
  expect(state.activate).not.toHaveBeenCalled();
  expect(await repos.sessions.get(session.id)).toEqual(before);
  expect(await repos.attempts.toArray()).toEqual(attempts);
  expect(await repos.progress.toArray()).toEqual(progress);
  expect(await repos.xpLedger.toArray()).toEqual(xp);
});

it('keeps committed answers and permits a direct retry after activation rejects', async () => {
  const { name, repos, session } = await setup({ answered: true });
  const before = await repos.sessions.get(session.id);
  const attempts = await repos.attempts.toArray();
  const progress = await repos.progress.toArray();
  const answerXp = await repos.xpLedger.toArray();
  expect(answerXp).toEqual([expect.objectContaining({ points: 10 })]);
  const otherConnection = await connect(name);
  let atActivation: Awaited<ReturnType<typeof repos.sessions.get>>;
  state.activate.mockImplementationOnce(async () => {
    atActivation = await otherConnection.sessions.get(session.id);
    throw Error('Activación fallida');
  });

  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión y actualizar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Activación fallida');
  const completed = await otherConnection.sessions.get(session.id);
  expect(atActivation).toEqual(completed);
  expect(completed).toMatchObject({
    ...before,
    status: 'completed',
    completedAt: expect.any(String),
  });
  expect(await otherConnection.attempts.toArray()).toEqual(attempts);
  expect(await otherConnection.progress.toArray()).toEqual(progress);
  const xp = await otherConnection.xpLedger.toArray();
  expect(xp).toEqual(expect.arrayContaining(answerXp));

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('alert')).toHaveTextContent('el cierre se ha completado');
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar actualización' }));
  await waitFor(() => expect(state.activate).toHaveBeenCalledTimes(2));
  expect(await otherConnection.sessions.get(session.id)).toEqual(completed);
  expect(await otherConnection.xpLedger.toArray()).toEqual(xp);
});

it('requires fresh consent when another tab replaces the session behind the original prompt', async () => {
  const { name, session, profile } = await setup();
  const otherConnection = await connect(name);
  const replacement = await replaceSession(
    otherConnection,
    study(profile.id),
    session.id,
    clock,
    () => 0.5,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión y actualizar' }));
  await waitFor(() => expect(within(screen.getByRole('status')).getByRole('button')).toBeEnabled());
  expect(await otherConnection.sessions.get(replacement.id)).toEqual(replacement);
  expect(state.activate).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toBeVisible();
});

it('keeps the session open when the waiting worker has disappeared before confirmation', async () => {
  const { repos, session } = await setup({ answered: true });
  const saved = await repos.sessions.get(session.id);
  const xp = await repos.xpLedger.toArray();
  state.prepare.mockRejectedValueOnce(Error('La actualización ya no está en espera'));

  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión y actualizar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('ya no está en espera');
  expect(await repos.sessions.get(session.id)).toEqual(saved);
  expect(await repos.xpLedger.toArray()).toEqual(xp);
  expect(state.activate).not.toHaveBeenCalled();
});

it('preserves a session paused in another tab while confirmation was open', async () => {
  const { name, session } = await setup({ answered: true });
  const otherConnection = await connect(name);
  await pauseSession(otherConnection, session.id);
  const saved = await otherConnection.sessions.get(session.id);
  const xp = await otherConnection.xpLedger.toArray();

  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión y actualizar' }));
  await waitFor(() => expect(state.activate).toHaveBeenCalledOnce());
  expect(await otherConnection.sessions.get(session.id)).toEqual(saved);
  expect(await otherConnection.xpLedger.toArray()).toEqual(xp);
});

it('rechecks for sessions started after the confirmed close and before activation', async () => {
  const { name, session, profile, refresh } = await setup();
  const otherConnection = await connect(name);
  let replacementId: string | undefined;
  refresh.mockImplementationOnce(async () => {
    replacementId = (await startSession(otherConnection, study(profile.id), clock, () => 0.5)).id;
  });

  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión y actualizar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Hay una sesión activa');
  expect(await otherConnection.sessions.where('status').equals('active').primaryKeys()).toEqual([
    replacementId,
  ]);
  expect((await otherConnection.sessions.get(session.id))?.status).toBe('completed');
  expect(state.activate).not.toHaveBeenCalled();
});
