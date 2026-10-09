import {
  SlotGridConfig,
  addDays,
  daysBetween,
  formatClock,
  isDateKey,
  isSlotStart,
  localToUtc,
  parseOpenWeekdays,
  slotOffsetsForDay,
  toLocalDateKey,
  toLocalMinutes,
  weekdayOf,
} from './slots.util';

/** The seeded default: two-hour slots, 10:00-18:00, Mon-Sat, GMT+4. */
const config: SlotGridConfig = {
  slotMinutes: 120,
  dayStartHour: 10,
  dayEndHour: 18,
  openWeekdays: '1,2,3,4,5,6',
  timezoneOffsetMinutes: 240,
};

describe('slots.util', () => {
  describe('isDateKey', () => {
    it('accepts a real calendar date', () => {
      expect(isDateKey('2026-10-09')).toBe(true);
    });

    it('rejects a date that does not exist', () => {
      expect(isDateKey('2026-02-31')).toBe(false);
    });

    it('rejects anything that is not a bare date', () => {
      expect(isDateKey('2026-10-9')).toBe(false);
      expect(isDateKey('2026-10-09T10:00:00Z')).toBe(false);
      expect(isDateKey('tomorrow')).toBe(false);
    });
  });

  describe('localToUtc', () => {
    it('converts a planner-local slot time to the right UTC instant', () => {
      // 10:00 in GMT+4 is 06:00 UTC the same day.
      expect(localToUtc('2026-10-09', 10 * 60, 240).toISOString()).toBe(
        '2026-10-09T06:00:00.000Z',
      );
    });

    it('rolls back a day when the local time is early and the offset positive', () => {
      // Midnight local in GMT+4 is 20:00 UTC the previous day.
      expect(localToUtc('2026-10-09', 0, 240).toISOString()).toBe(
        '2026-10-08T20:00:00.000Z',
      );
    });

    it('handles negative offsets', () => {
      // 10:00 in GMT-5 is 15:00 UTC.
      expect(localToUtc('2026-10-09', 10 * 60, -300).toISOString()).toBe(
        '2026-10-09T15:00:00.000Z',
      );
    });
  });

  describe('toLocalDateKey', () => {
    it('reports the planner-local day, not the UTC day', () => {
      // 21:00 UTC is already the next day at GMT+4.
      expect(toLocalDateKey(new Date('2026-10-09T21:00:00Z'), 240)).toBe(
        '2026-10-10',
      );
    });

    it('round-trips with localToUtc', () => {
      const instant = localToUtc('2027-01-31', 16 * 60, 240);
      expect(toLocalDateKey(instant, 240)).toBe('2027-01-31');
      expect(toLocalMinutes(instant, 240)).toBe(16 * 60);
    });
  });

  describe('slotOffsetsForDay', () => {
    it('generates the four two-hour slots of a 10-18 day', () => {
      expect(slotOffsetsForDay(config).map(formatClock)).toEqual([
        '10:00',
        '12:00',
        '14:00',
        '16:00',
      ]);
    });

    it('never generates a slot that would run past closing time', () => {
      const offsets = slotOffsetsForDay({ ...config, dayEndHour: 17 });
      expect(offsets.map(formatClock)).toEqual(['10:00', '12:00', '14:00']);
    });

    it('returns nothing when the working day is shorter than one slot', () => {
      expect(
        slotOffsetsForDay({ ...config, dayStartHour: 10, dayEndHour: 11 }),
      ).toEqual([]);
    });
  });

  describe('isSlotStart', () => {
    it('accepts a slot start on an open day', () => {
      // Friday 2026-10-09, 14:00 local.
      expect(isSlotStart(new Date('2026-10-09T10:00:00Z'), config)).toBe(true);
    });

    it('rejects a time between slots', () => {
      expect(isSlotStart(new Date('2026-10-09T07:00:00Z'), config)).toBe(false);
    });

    it('rejects a time outside working hours', () => {
      // 20:00 local.
      expect(isSlotStart(new Date('2026-10-09T16:00:00Z'), config)).toBe(false);
    });

    it('rejects a closed weekday', () => {
      // 2026-10-11 is a Sunday, which is not in openWeekdays.
      expect(weekdayOf('2026-10-11')).toBe(0);
      expect(isSlotStart(new Date('2026-10-11T06:00:00Z'), config)).toBe(false);
    });

    it('rejects a slot start that is not on the hour', () => {
      expect(isSlotStart(new Date('2026-10-09T06:30:00Z'), config)).toBe(false);
    });
  });

  describe('parseOpenWeekdays', () => {
    it('parses, de-duplicates and sorts', () => {
      expect(parseOpenWeekdays('6,1,1,3')).toEqual([1, 3, 6]);
    });

    it('drops values that are not weekdays', () => {
      expect(parseOpenWeekdays('0,7,-1,x,5')).toEqual([0, 5]);
    });
  });

  describe('date arithmetic', () => {
    it('adds days across a month boundary', () => {
      expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    });

    it('adds days across a leap day', () => {
      expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    });

    it('measures whole days in both directions', () => {
      expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30);
      expect(daysBetween('2026-10-31', '2026-10-01')).toBe(-30);
      expect(daysBetween('2026-10-09', '2026-10-09')).toBe(0);
    });
  });
});
