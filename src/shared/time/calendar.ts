import { Temporal } from '@js-temporal/polyfill';
export function toLocalDate(at: string, zone: string): string {
  return Temporal.Instant.from(at).toZonedDateTimeISO(zone).toPlainDate().toString();
}
export function addCalendarDays(day: string, n: number): string {
  return Temporal.PlainDate.from(day).add({ days: n }).toString();
}
