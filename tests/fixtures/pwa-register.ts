// Vitest resolution target for the build-time virtual module. Tests provide its port.
export function registerSW(): never {
  throw new Error('PWA registration port must be supplied by the test');
}
