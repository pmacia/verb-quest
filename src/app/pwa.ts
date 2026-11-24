import { registerSW } from 'virtual:pwa-register';

const listeners = new Set<() => void>();
const activationTimeout = 10_000;
let registered = false;
let updateReady = false;

export function registerAppUpdates(onUpdateReady: () => void) {
  listeners.add(onUpdateReady);
  if (updateReady) onUpdateReady();
  if (!registered && 'serviceWorker' in navigator) {
    registered = true;
    registerSW({
      immediate: true,
      onNeedRefresh: () => {
        updateReady = true;
        for (const listener of listeners) listener();
      },
      // Only the tab that confirmed the update should reload.
      onNeedReload: () => {},
      onRegisterError: (error) => {
        registered = false;
        console.error('No se pudo preparar el modo sin conexión:', error);
      },
    });
  }
  return () => {
    listeners.delete(onUpdateReady);
  };
}

const unavailable = () =>
  Error('La actualización ya no está en espera. Puedes recargar la aplicación cuando termines.');

export async function prepareAppUpdate() {
  const workers = navigator.serviceWorker;
  const registration = await workers?.getRegistration();
  if (!registration?.waiting) throw unavailable();
  const waiting = registration.waiting;

  return async () => {
    await new Promise<void>((resolve, reject) => {
      function finish(error?: unknown) {
        clearTimeout(timeout);
        workers.removeEventListener('controllerchange', checkController);
        waiting.removeEventListener('statechange', checkWorker);
        if (error === undefined) resolve();
        else reject(error);
      }

      function checkController() {
        if (workers.controller === waiting) finish();
        else finish(unavailable());
      }

      function checkWorker() {
        if (waiting.state === 'redundant') finish(unavailable());
      }

      const timeout = setTimeout(
        () => finish(Error('La actualización no se ha activado. Vuelve a intentarlo.')),
        activationTimeout,
      );
      workers.addEventListener('controllerchange', checkController);
      waiting.addEventListener('statechange', checkWorker);

      try {
        if (workers.controller === waiting) finish();
        else if (waiting.state === 'redundant') finish(unavailable());
        // Vite PWA's generated Workbox worker listens for this message in prompt mode.
        else if (registration.waiting === waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
      } catch (error) {
        finish(error);
      }
    });

    updateReady = false;
    window.location.reload();
  };
}
