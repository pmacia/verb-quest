import { it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { openAppDatabase } from '../persistence/repositories';
import { bootstrap } from '../persistence/bootstrap';
import { dataset } from '../../../tests/fixtures/dataset';
import { startSession } from '../learning-engine/session-service';
import { SessionShell } from './SessionShell';
import { StudyPage } from './StudyPage';
const state = vi.hoisted(() => ({ data: null as any }));
vi.mock('../../app/AppProviders', () => ({ useApp: () => state.data }));
afterEach(cleanup);
const clock = { now: () => '2026-10-29T12:00:00Z' };
async function prepare() {
  const r = await openAppDatabase(crypto.randomUUID());
  const profile = await bootstrap(r, dataset, clock);
  const session = await startSession(
    r,
    {
      kind: 'free',
      profileId: profile.id,
      verbIds: ['go', 'be', 'take'],
      modes: ['quiz'],
      skills: ['recognition'],
    },
    clock,
    () => 0.5,
  );
  state.data = {
    repos: r,
    profile,
    sessions: [session],
    plans: [],
    verbs: dataset.verbs,
    refresh: async () => {},
  };
  const fail = () => {
    throw Error('quota');
  };
  return { r, session, fail };
}
it('pause failures are visible and the original action can be retried', async () => {
  const { r, session, fail } = await prepare();
  r.sessions.hook('updating', fail);
  render(
    <MemoryRouter>
      <SessionShell session={session} />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Pausar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('quota');
  expect((await r.sessions.get(session.id))?.status).toBe('active');
  r.sessions.hook('updating').unsubscribe(fail);
  await userEvent.click(screen.getByRole('button', { name: 'Pausar' }));
  expect(await screen.findByText('Tu sesión está a salvo')).toBeVisible();
  r.close();
});
it('finalization failures are visible and do not announce completion', async () => {
  const { r, session, fail } = await prepare();
  r.sessions.hook('updating', fail);
  render(
    <MemoryRouter>
      <SessionShell session={session} />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Terminar sesión' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('quota');
  expect((await r.sessions.get(session.id))?.status).toBe('active');
  r.close();
});
it('resume failures are visible above the active session with an explicit retry', async () => {
  const { r, session, fail } = await prepare();
  r.sessions.hook('updating', fail);
  render(
    <MemoryRouter>
      <StudyPage />
    </MemoryRouter>,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('quota');
  r.sessions.hook('updating').unsubscribe(fail);
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar reanudación' }));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  r.close();
});
