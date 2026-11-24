import { afterEach, expect, it, vi } from 'vitest';

const port = vi.hoisted(() => ({
  register: vi.fn<(options: { onNeedRefresh: () => void }) => void>(),
}));
vi.mock('virtual:pwa-register', () => ({ registerSW: port.register }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  port.register.mockReset();
});

it('shares a registration across mounts and only notifies subscribed views', async () => {
  vi.stubGlobal('navigator', { serviceWorker: {} });
  const { registerAppUpdates } = await import('./pwa');
  const first = vi.fn();
  const second = vi.fn();
  const unsubscribe = registerAppUpdates(first);
  unsubscribe();
  registerAppUpdates(second);
  expect(port.register).toHaveBeenCalledOnce();

  port.register.mock.calls[0][0].onNeedRefresh();
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledOnce();
  const late = vi.fn();
  registerAppUpdates(late);
  expect(late).toHaveBeenCalledOnce();
});

it('refuses preparation without a waiting service worker', async () => {
  vi.stubGlobal('navigator', {
    serviceWorker: { getRegistration: async () => ({ waiting: null }) },
  });
  const { prepareAppUpdate } = await import('./pwa');
  await expect(prepareAppUpdate()).rejects.toThrow('ya no está en espera');
});

it('reports when another worker takes control during the request', async () => {
  const postMessage = vi.fn();
  const waiting = Object.assign(new EventTarget(), { state: 'installed', postMessage });
  const workers = Object.assign(new EventTarget(), {
    getRegistration: async () => ({ waiting }),
    controller: {},
  });
  vi.stubGlobal('navigator', { serviceWorker: workers });
  const { prepareAppUpdate } = await import('./pwa');
  const activate = await prepareAppUpdate();
  expect(postMessage).not.toHaveBeenCalled();
  const request = activate();
  expect(postMessage).toHaveBeenCalledExactlyOnceWith({ type: 'SKIP_WAITING' });

  workers.dispatchEvent(new Event('controllerchange'));
  await expect(request).rejects.toThrow('ya no está en espera');
});
