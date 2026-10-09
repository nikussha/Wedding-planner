export interface AvailabilitySetting {
  id: string;
  /** Length of one bookable slot, in minutes. */
  slotMinutes: number;
  /** First hour of the working day, planner-local. */
  dayStartHour: number;
  /** Hour the working day ends; slots must finish by then. */
  dayEndHour: number;
  /** Comma-separated weekdays open for bookings, 0 = Sunday … 6 = Saturday. */
  openWeekdays: string;
  /** Minimum notice before a slot can be requested. */
  leadTimeHours: number;
  /** How far ahead the calendar can be booked. */
  horizonDays: number;
  /** Fixed UTC offset the slot times are expressed in (240 = GMT+4). */
  timezoneOffsetMinutes: number;
  timezoneLabel: string;
  updatedAt: string;
}

export interface UpdateAvailabilitySettingsPayload {
  slotMinutes: number;
  dayStartHour: number;
  dayEndHour: number;
  openWeekdays: number[];
  leadTimeHours: number;
  horizonDays: number;
  timezoneOffsetMinutes: number;
  timezoneLabel: string;
}

export interface BlockedDate {
  id: string;
  /** Midnight UTC of the closed calendar date. */
  date: string;
  reason: string | null;
  createdAt: string;
}
