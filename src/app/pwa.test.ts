import { it, expect, vi } from 'vitest';
import { registerAppUpdates, activateUpdate } from './pwa';
const port = vi.hoisted(() => ({
  activate: vi.fn(async () => {}),
  registered: null as null | { onNeedRefresh: () => void },
}));
vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: { onNeedRefresh: () => void }) => {
    port.registered = options;
    return port.activate;
  },
}));
it('an available update waits for a user action and rejects an active-session race', async () => {
  Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
  let active = false;
  const ready = vi.fn();
  registerAppUpdates({ hasActiveSession: async () => active, onUpdateReady: ready });
  port.registered!.onNeedRefresh();
  expect(ready).toHaveBeenCalledOnce();
  expect(port.activate).not.toHaveBeenCalled();
  active = true;
  await expect(activateUpdate()).rejects.toThrow('Pausa o termina');
  expect(port.activate).not.toHaveBeenCalled();
  active = false;
  await activateUpdate();
  expect(port.activate).toHaveBeenCalledExactlyOnceWith(true);
});
