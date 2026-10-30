import { it, expect } from 'vitest';
import { toLocalDate, addCalendarDays } from './calendar';
it('uses the profile date near midnight and across DST repeats', () => {
  expect(toLocalDate('2026-10-24T22:30:00Z', 'Europe/Madrid')).toBe('2026-10-25');
  expect(toLocalDate('2026-10-25T00:30:00Z', 'Europe/Madrid')).toBe('2026-10-25');
  expect(toLocalDate('2026-10-25T01:30:00Z', 'Europe/Madrid')).toBe('2026-10-25');
});
it('adds calendar days rather than fixed 24h intervals', () => {
  expect(addCalendarDays('2026-10-24', 1)).toBe('2026-10-25');
  expect(addCalendarDays('2026-10-24', 2)).toBe('2026-10-26');
});
