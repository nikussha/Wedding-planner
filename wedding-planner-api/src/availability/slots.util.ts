/**
 * Slot maths for the booking calendar.
 *
 * The planner takes bookings in a single fixed-offset timezone (see
 * AvailabilitySetting.timezoneOffsetMinutes), so the grid can be derived with
 * plain arithmetic and no timezone database. Slot instants are always stored
 * and returned as UTC; the "local" values below exist only to build and label
 * the grid, so that the calendar a visitor in another country sees is the
 * planner's working day, not their own.
 */

export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;
export const MINUTES_PER_DAY = 1_440;

/** The subset of AvailabilitySetting needed to lay out the grid. */
export interface SlotGridConfig {
  slotMinutes: number;
  dayStartHour: number;
  dayEndHour: number;
  openWeekdays: string;
  timezoneOffsetMinutes: number;
}

/** A calendar date with no time or zone, as 'YYYY-MM-DD'. */
export type DateKey = string;

export const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_KEY_MESSAGE = 'must be a calendar date in YYYY-MM-DD form';

export function isDateKey(value: string): boolean {
  if (!DATE_KEY_REGEX.test(value)) return false;
  // Rejects 2026-02-31: round-tripping a real date gives back the same string.
  return keyToUtcMidnight(value).toISOString().slice(0, 10) === value;
}

/** Midnight UTC of a date key, used as a plain date marker (e.g. BlockedDate). */
export function keyToUtcMidnight(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function utcMidnightToKey(date: Date): DateKey {
  return date.toISOString().slice(0, 10);
}

/** The planner-local date a UTC instant falls on. */
export function toLocalDateKey(instant: Date, offsetMinutes: number): DateKey {
  return new Date(instant.getTime() + offsetMinutes * MS_PER_MINUTE)
    .toISOString()
    .slice(0, 10);
}

/** Minutes since planner-local midnight for a UTC instant. */
export function toLocalMinutes(instant: Date, offsetMinutes: number): number {
  const shifted = new Date(instant.getTime() + offsetMinutes * MS_PER_MINUTE);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** The UTC instant of `minutesFromMidnight` on a planner-local date. */
export function localToUtc(
  key: DateKey,
  minutesFromMidnight: number,
  offsetMinutes: number,
): Date {
  return new Date(
    keyToUtcMidnight(key).getTime() +
      (minutesFromMidnight - offsetMinutes) * MS_PER_MINUTE,
  );
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: DateKey): number {
  return keyToUtcMidnight(key).getUTCDay();
}

export function addDays(key: DateKey, days: number): DateKey {
  return utcMidnightToKey(
    new Date(keyToUtcMidnight(key).getTime() + days * MS_PER_DAY),
  );
}

/** Whole days from `from` to `to`, negative if `to` is earlier. */
export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round(
    (keyToUtcMidnight(to).getTime() - keyToUtcMidnight(from).getTime()) /
      MS_PER_DAY,
  );
}

/** '1,2,3' -> [1, 2, 3]. Unparseable entries are dropped. */
export function parseOpenWeekdays(value: string): number[] {
  return [
    ...new Set(
      value
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    ),
  ].sort((a, b) => a - b);
}

/**
 * Minutes-from-midnight of every slot on an open day, e.g. [600, 720, 840, 960]
 * for two-hour slots between 10:00 and 18:00. A slot is only generated when it
 * fits entirely inside the working day.
 */
export function slotOffsetsForDay(config: SlotGridConfig): number[] {
  const offsets: number[] = [];
  const dayStart = config.dayStartHour * 60;
  const dayEnd = config.dayEndHour * 60;
  if (config.slotMinutes <= 0) return offsets;

  for (
    let minute = dayStart;
    minute + config.slotMinutes <= dayEnd;
    minute += config.slotMinutes
  ) {
    offsets.push(minute);
  }
  return offsets;
}

/** 600 -> '10:00'. */
export function formatClock(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60) % 24;
  const minutes = minutesFromMidnight % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * True when `instant` is exactly the start of a slot on an open weekday of the
 * grid. Callers still need to check blocked dates and the booking window.
 */
export function isSlotStart(instant: Date, config: SlotGridConfig): boolean {
  const key = toLocalDateKey(instant, config.timezoneOffsetMinutes);
  if (!parseOpenWeekdays(config.openWeekdays).includes(weekdayOf(key)))
    return false;
  if (instant.getTime() % (60 * MS_PER_MINUTE) !== 0) return false;

  return slotOffsetsForDay(config).includes(
    toLocalMinutes(instant, config.timezoneOffsetMinutes),
  );
}
