/**
 * Formatting for slot instants.
 *
 * Slots are stored as UTC but belong to the planner's own working day, so they
 * are always rendered through the configured offset rather than the browser's
 * timezone - otherwise an admin travelling abroad would see every appointment
 * shifted. Formatting is pinned to en-GB so dates read the same everywhere.
 */

const LOCALE = 'en-GB';

/** Splits a UTC instant into the planner-local date key and clock time. */
export function toPlannerParts(
  instant: string,
  offsetMinutes: number,
): { date: string; clock: string } {
  const shifted = new Date(new Date(instant).getTime() + offsetMinutes * 60_000).toISOString();
  return { date: shifted.slice(0, 10), clock: shifted.slice(11, 16) };
}

function keyToDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** 'Mon 12 Oct 2026' */
export function formatPlannerDate(instant: string, offsetMinutes: number): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(keyToDate(toPlannerParts(instant, offsetMinutes).date));
}

/** '10:00 – 12:00' */
export function formatPlannerTimeRange(
  start: string,
  end: string,
  offsetMinutes: number,
): string {
  return `${toPlannerParts(start, offsetMinutes).clock} – ${toPlannerParts(end, offsetMinutes).clock}`;
}

/** 'Mon 12 Oct 2026' for a date-only value such as BlockedDate.date. */
export function formatCalendarDate(dateIso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateIso));
}
