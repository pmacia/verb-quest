import { registerSW } from 'virtual:pwa-register';
let update: ((reload?: boolean) => Promise<void>) | undefined;
let canUpdate: (() => Promise<boolean>) | undefined;
export function registerAppUpdates(input: {
  hasActiveSession: () => Promise<boolean>;
  onUpdateReady: () => void;
}) {
  canUpdate = async () => !(await input.hasActiveSession());
  if ('serviceWorker' in navigator) {
    update = registerSW({
      immediate: true,
      onNeedRefresh: input.onUpdateReady,
      onRegisterError: (e) => console.error('No se pudo preparar el modo sin conexión:', e),
    });
  }
  return () => {};
}
export async function activateUpdate() {
  if (!canUpdate || !(await canUpdate()))
    throw Error('Pausa o termina la sesión antes de actualizar.');
  await update?.(true);
}
