import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilitySetting } from '@prisma/client';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { CreateBlockedDateDto } from './dto/create-blocked-date.dto';
import { UpdateAvailabilitySettingsDto } from './dto/update-availability-settings.dto';
import {
  DateKey,
  MS_PER_MINUTE,
  addDays,
  daysBetween,
  formatClock,
  isDateKey,
  isSlotStart,
  keyToUtcMidnight,
  localToUtc,
  parseOpenWeekdays,
  slotOffsetsForDay,
  toLocalDateKey,
  utcMidnightToKey,
  weekdayOf,
} from './slots.util';

/** The settings row is a singleton; there is only ever one planner schedule. */
const SETTINGS_ID = 'default';

/** Guards against a request for ten years of calendar in one response. */
export const MAX_CALENDAR_DAYS = 100;

/**
 * Why a slot cannot be requested. RESERVED means someone else's request was
 * confirmed; TOO_SOON means it falls inside the planner's notice period.
 */
export type SlotState = 'FREE' | 'RESERVED' | 'PAST' | 'TOO_SOON';

/** Why a whole day has no slots. */
export type ClosedReason = 'WEEKDAY' | 'BLOCKED' | 'PAST' | 'BEYOND_HORIZON';

export interface CalendarSlot {
  /** UTC instant, the value POST /bookings expects back. */
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
  /** The admin's note for a blocked date, e.g. 'Public holiday'. */
  closedNote: string | null;
  slots: CalendarSlot[];
  freeCount: number;
  totalCount: number;
}

export interface CalendarResponse {
  from: DateKey;
  to: DateKey;
  /** Booking window, for clamping month navigation in the UI. */
  firstBookableDate: DateKey;
  lastBookableDate: DateKey;
  slotMinutes: number;
  leadTimeHours: number;
  /** Fixed offset the slot labels are expressed in, e.g. 240 for GMT+4. */
  timezoneOffsetMinutes: number;
  timezoneLabel: string;
  days: CalendarDay[];
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /** The singleton settings row, created from schema defaults on first use. */
  getSettings(): Promise<AvailabilitySetting> {
    return this.prisma.availabilitySetting.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  }

  async updateSettings(
    dto: UpdateAvailabilitySettingsDto,
  ): Promise<AvailabilitySetting> {
    if (dto.dayEndHour <= dto.dayStartHour) {
      throw new BadRequestException(
        'The working day must end after it starts.',
      );
    }

    const windowMinutes = (dto.dayEndHour - dto.dayStartHour) * 60;
    if (dto.slotMinutes > windowMinutes) {
      throw new BadRequestException(
        `A ${dto.slotMinutes}-minute slot does not fit between ${dto.dayStartHour}:00 and ${dto.dayEndHour}:00.`,
      );
    }

    const openWeekdays = [...new Set(dto.openWeekdays)].sort((a, b) => a - b);
    const data = { ...dto, openWeekdays: openWeekdays.join(',') };

    return this.prisma.availabilitySetting.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...data },
    });
  }

  listBlockedDates() {
    return this.prisma.blockedDate.findMany({ orderBy: { date: 'asc' } });
  }

  /** Closing an already-closed date just updates its note. */
  async addBlockedDate(dto: CreateBlockedDateDto) {
    this.assertDateKey(dto.date, 'date');
    const date = keyToUtcMidnight(dto.date);

    return this.prisma.blockedDate.upsert({
      where: { date },
      update: { reason: dto.reason ?? null },
      create: { date, reason: dto.reason ?? null },
    });
  }

  async removeBlockedDate(id: string) {
    const existing = await this.prisma.blockedDate.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Blocked date not found');
    }
    return this.prisma.blockedDate.delete({ where: { id } });
  }

  /**
   * Builds the calendar grid for a date range. This is public, anonymous data:
   * a reserved slot is reported as reserved and nothing else, so one visitor
   * can never learn who holds another's booking. Clients mark their own
   * requests by cross-referencing GET /bookings/me.
   */
  async getCalendar(query: CalendarQueryDto): Promise<CalendarResponse> {
    this.assertDateKey(query.from, 'from');
    this.assertDateKey(query.to, 'to');

    const span = daysBetween(query.from, query.to);
    if (span < 0) {
      throw new BadRequestException('"to" must not be earlier than "from".');
    }
    if (span + 1 > MAX_CALENDAR_DAYS) {
      throw new BadRequestException(
        `Request at most ${MAX_CALENDAR_DAYS} days of calendar at a time.`,
      );
    }

    const settings = await this.getSettings();
    const offset = settings.timezoneOffsetMinutes;
    const now = new Date();
    const todayKey = toLocalDateKey(now, offset);
    const earliestBookable = new Date(
      now.getTime() + settings.leadTimeHours * 60 * MS_PER_MINUTE,
    );
    const firstBookableDate = toLocalDateKey(earliestBookable, offset);
    const lastBookableDate = addDays(todayKey, settings.horizonDays);

    const rangeStart = localToUtc(query.from, 0, offset);
    const rangeEnd = localToUtc(addDays(query.to, 1), 0, offset);

    const [taken, blockedDates] = await Promise.all([
      // Overlap, not equality: if the admin changes the slot length, already
      // confirmed appointments still block the times they cover.
      this.prisma.appointment.findMany({
        where: {
          status: BookingStatus.CONFIRMED,
          slotStart: { lt: rangeEnd },
          slotEnd: { gt: rangeStart },
        },
        select: { slotStart: true, slotEnd: true },
      }),
      this.prisma.blockedDate.findMany({
        where: {
          date: {
            gte: keyToUtcMidnight(query.from),
            lte: keyToUtcMidnight(query.to),
          },
        },
      }),
    ]);

    const takenRanges = taken.map((row) => ({
      start: row.slotStart.getTime(),
      end: row.slotEnd.getTime(),
    }));
    const blockedByDate = new Map(
      blockedDates.map(
        (row) => [utcMidnightToKey(row.date), row.reason] as const,
      ),
    );

    const openWeekdays = parseOpenWeekdays(settings.openWeekdays);
    const slotOffsets = slotOffsetsForDay(settings);
    const days: CalendarDay[] = [];

    for (
      let cursor = query.from;
      daysBetween(cursor, query.to) >= 0;
      cursor = addDays(cursor, 1)
    ) {
      const weekday = weekdayOf(cursor);
      const closedReason = this.closedReasonFor(cursor, {
        todayKey,
        lastBookableDate,
        weekday,
        openWeekdays,
        isBlocked: blockedByDate.has(cursor),
      });

      if (closedReason) {
        days.push({
          date: cursor,
          weekday,
          open: false,
          closedReason,
          closedNote: blockedByDate.get(cursor) ?? null,
          slots: [],
          freeCount: 0,
          totalCount: 0,
        });
        continue;
      }

      const slots = slotOffsets.map<CalendarSlot>((minutes) => {
        const start = localToUtc(cursor, minutes, offset);
        const end = localToUtc(cursor, minutes + settings.slotMinutes, offset);

        return {
          start: start.toISOString(),
          end: end.toISOString(),
          startLabel: formatClock(minutes),
          endLabel: formatClock(minutes + settings.slotMinutes),
          state: this.slotStateFor(start, end, {
            now,
            earliestBookable,
            takenRanges,
          }),
        };
      });

      days.push({
        date: cursor,
        weekday,
        open: true,
        closedReason: null,
        closedNote: null,
        slots,
        freeCount: slots.filter((slot) => slot.state === 'FREE').length,
        totalCount: slots.length,
      });
    }

    return {
      from: query.from,
      to: query.to,
      firstBookableDate,
      lastBookableDate,
      slotMinutes: settings.slotMinutes,
      leadTimeHours: settings.leadTimeHours,
      timezoneOffsetMinutes: offset,
      timezoneLabel: settings.timezoneLabel,
      days,
    };
  }

  /**
   * Validates that `slotStartIso` is a real, open, still-bookable slot and
   * returns its boundaries. Throws BadRequestException with a message that is
   * safe to show the visitor. Whether the slot is already confirmed is NOT
   * checked here - that is a conflict, handled by BookingsService inside its
   * transaction so two simultaneous requests cannot both win.
   */
  async resolveBookableSlot(
    slotStartIso: string,
  ): Promise<{ slotStart: Date; slotEnd: Date }> {
    const settings = await this.getSettings();
    const slotStart = new Date(slotStartIso);
    if (Number.isNaN(slotStart.getTime())) {
      throw new BadRequestException('That is not a valid time.');
    }

    if (!isSlotStart(slotStart, settings)) {
      throw new BadRequestException(
        'That time is not one of the available appointment slots.',
      );
    }

    const dateKey = toLocalDateKey(slotStart, settings.timezoneOffsetMinutes);
    const blocked = await this.prisma.blockedDate.findUnique({
      where: { date: keyToUtcMidnight(dateKey) },
    });
    if (blocked) {
      throw new BadRequestException(
        blocked.reason
          ? `That date is unavailable: ${blocked.reason}.`
          : 'That date is unavailable.',
      );
    }

    const now = new Date();
    if (slotStart.getTime() < now.getTime()) {
      throw new BadRequestException('That time has already passed.');
    }

    const earliestBookable = new Date(
      now.getTime() + settings.leadTimeHours * 60 * MS_PER_MINUTE,
    );
    if (slotStart.getTime() < earliestBookable.getTime()) {
      throw new BadRequestException(
        `Appointments need at least ${settings.leadTimeHours} hours of notice.`,
      );
    }

    const horizonEnd = localToUtc(
      addDays(
        toLocalDateKey(now, settings.timezoneOffsetMinutes),
        settings.horizonDays + 1,
      ),
      0,
      settings.timezoneOffsetMinutes,
    );
    if (slotStart.getTime() >= horizonEnd.getTime()) {
      throw new BadRequestException('That date is too far ahead to book yet.');
    }

    return {
      slotStart,
      slotEnd: new Date(
        slotStart.getTime() + settings.slotMinutes * MS_PER_MINUTE,
      ),
    };
  }

  private closedReasonFor(
    date: DateKey,
    context: {
      todayKey: DateKey;
      lastBookableDate: DateKey;
      weekday: number;
      openWeekdays: number[];
      isBlocked: boolean;
    },
  ): ClosedReason | null {
    if (date < context.todayKey) return 'PAST';
    if (date > context.lastBookableDate) return 'BEYOND_HORIZON';
    if (!context.openWeekdays.includes(context.weekday)) return 'WEEKDAY';
    if (context.isBlocked) return 'BLOCKED';
    return null;
  }

  private slotStateFor(
    start: Date,
    end: Date,
    context: {
      now: Date;
      earliestBookable: Date;
      takenRanges: ReadonlyArray<{ start: number; end: number }>;
    },
  ): SlotState {
    const overlapsConfirmed = context.takenRanges.some(
      (taken) => taken.start < end.getTime() && taken.end > start.getTime(),
    );
    if (overlapsConfirmed) return 'RESERVED';
    if (start.getTime() < context.now.getTime()) return 'PAST';
    if (start.getTime() < context.earliestBookable.getTime()) return 'TOO_SOON';
    return 'FREE';
  }

  private assertDateKey(value: string, field: string): void {
    if (!isDateKey(value)) {
      throw new BadRequestException(
        `"${field}" must be a real calendar date in YYYY-MM-DD form.`,
      );
    }
  }
}
