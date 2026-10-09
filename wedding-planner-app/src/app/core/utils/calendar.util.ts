import { CalendarDay, DateKey } from '../models/availability.model';

/**
 * Date helpers for the booking calendar.
 *
 * Every date is handled as a 'YYYY-MM-DD' key and formatted through UTC, so a
 * visitor's own timezone can never shift the grid by a day. Formatting is
 * pinned to en-GB rather than the ambient locale so the server-rendered markup
 * and the hydrated markup always agree.
 */

const MS_PER_DAY = 86_400_000;
const LOCALE = 'en-GB';

export const WEEKDAY_HEADERS: ReadonlyArray<{ short: string; full: string }> = [
  { short: 'Mo', full: 'Monday' },
  { short: 'Tu', full: 'Tuesday' },
  { short: 'We', full: 'Wednesday' },
  { short: 'Th', full: 'Thursday' },
  { short: 'Fr', full: 'Friday' },
  { short: 'Sa', full: 'Saturday' },
  { short: 'Su', full: 'Sunday' },
];

export function keyToDate(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function dateToKey(date: Date): DateKey {
  return date.toISOString().slice(0, 10);
}

/** Today in the visitor's own timezone, used only to pick the opening month. */
export function todayKey(): DateKey {
  const now = new Date();
  return dateToKey(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function addDays(key: DateKey, days: number): DateKey {
  return dateToKey(new Date(keyToDate(key).getTime() + days * MS_PER_DAY));
}

export function dayOfMonth(key: DateKey): number {
  return keyToDate(key).getUTCDate();
}

/** 'YYYY-MM' for the month a date falls in. */
export function monthOf(key: DateKey): string {
  return key.slice(0, 7);
}

export function firstDayOfMonth(month: string): DateKey {
  return `${month}-01`;
}

export function lastDayOfMonth(month: string): DateKey {
  const [year, monthNumber] = month.split('-').map(Number);
  return dateToKey(new Date(Date.UTC(year, monthNumber, 0)));
}

export function addMonths(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return dateToKey(shifted).slice(0, 7);
}

/** Monday of the week containing `key`, so grid rows always start on Monday. */
export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, -mondayFirstWeekday(key));
}

/** Sunday of the week containing `key`. */
export function endOfWeek(key: DateKey): DateKey {
  return addDays(key, 6 - mondayFirstWeekday(key));
}

/** Monday = 0 … Sunday = 6, the order the grid is laid out in. */
export function mondayFirstWeekday(key: DateKey): number {
  return (keyToDate(key).getUTCDay() + 6) % 7;
}

/** Splits a run of days into Monday-first rows of seven. */
export function toWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

/**
 * Splits a UTC instant into the planner-local date and clock time, so a stored
 * slot reads back as the same 10:00 the visitor originally picked, wherever
 * they happen to be.
 */
export function toPlannerParts(
  instant: string,
  offsetMinutes: number,
): { date: DateKey; clock: string } {
  const shifted = new Date(new Date(instant).getTime() + offsetMinutes * 60_000).toISOString();
  return { date: shifted.slice(0, 10), clock: shifted.slice(11, 16) };
}

/** 'October 2026' */
export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(keyToDate(firstDayOfMonth(month)));
}

/** 'Monday 12 October' */
export function formatDayAndMonth(key: DateKey): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(keyToDate(key));
}

/** 'Monday 12 October 2026' */
export function formatFullDate(key: DateKey): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(keyToDate(key));
}
