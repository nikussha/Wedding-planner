/** A calendar date with no time or zone, as 'YYYY-MM-DD'. */
export type DateKey = string;

/**
 * Why a slot cannot be requested. RESERVED means the planner confirmed someone
 * else's request; TOO_SOON means it falls inside the planner's notice period.
 */
export type SlotState = 'FREE' | 'RESERVED' | 'PAST' | 'TOO_SOON';

/** Why a whole day has no slots. */
export type ClosedReason = 'WEEKDAY' | 'BLOCKED' | 'PAST' | 'BEYOND_HORIZON';

export interface CalendarSlot {
  /** UTC instant to send back when requesting this slot. */
  start: string;
  end: string;
  /** Planner-local labels, e.g. '10:00' and '12:00'. */
  startLabel: string;
  endLabel: string;
  state: SlotState;
}

export interface CalendarDay {
  date: DateKey;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  open: boolean;
  closedReason: ClosedReason | null;
  closedNote: string | null;
  slots: CalendarSlot[];
  freeCount: number;
  totalCount: number;
}

/** The planner's opening hours, as the admin panel saves them. */
export interface AvailabilitySettings {
  slotMinutes: number;
  dayStartHour: number;
  dayEndHour: number;
  openWeekdays: string;
  leadTimeHours: number;
  horizonDays: number;
  timezoneOffsetMinutes: number;
  timezoneLabel: string;
}

export interface AvailabilityCalendar {
  from: DateKey;
  to: DateKey;
  firstBookableDate: DateKey;
  lastBookableDate: DateKey;
  slotMinutes: number;
  leadTimeHours: number;
  /** Fixed offset the slot labels are expressed in, e.g. 240 for GMT+4. */
  timezoneOffsetMinutes: number;
  /** Shown beside every time, e.g. 'GMT+4'. */
  timezoneLabel: string;
  days: CalendarDay[];
}
