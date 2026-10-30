import { it, expect, vi, afterEach } from 'vitest';
import { createId } from './create-id';
afterEach(() => vi.unstubAllGlobals());
it('uses native randomUUID when available with its Crypto receiver', () => {
  const port = {
    randomUUID() {
      expect(this).toBe(port);
      return 'native-id';
    },
    getRandomValues: vi.fn(),
  };
  vi.stubGlobal('crypto', port);
  expect(createId()).toBe('native-id');
  expect(port.getRandomValues).not.toHaveBeenCalled();
});
it('builds a UUID v4 from secure random bytes when HTTP has no randomUUID', () => {
  const port = {
    getRandomValues: vi.fn((bytes: Uint8Array) => {
      bytes.fill(255);
      return bytes;
    }),
  };
  vi.stubGlobal('crypto', port);
  expect(createId()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  expect(port.getRandomValues).toHaveBeenCalledOnce();
});
it('requests fresh entropy for each identifier', () => {
  let seed = 0;
  vi.stubGlobal('crypto', {
    getRandomValues(bytes: Uint8Array) {
      bytes.fill(seed++);
      return bytes;
    },
  });
  const first = createId();
  expect(first).toBe('00000000-0000-4000-8000-000000000000');
  expect(createId()).toBe('01010101-0101-4101-8101-010101010101');
});
