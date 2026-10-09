import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAvailabilitySettingsDto {
  /** Length of one bookable slot, in minutes. */
  @IsInt()
  @Min(15)
  @Max(480)
  slotMinutes!: number;

  /** First hour of the working day, planner-local (10 = 10:00). */
  @IsInt()
  @Min(0)
  @Max(23)
  dayStartHour!: number;

  /** Hour the working day ends; slots must finish by then. */
  @IsInt()
  @Min(1)
  @Max(24)
  dayEndHour!: number;

  /** Weekdays open for bookings, 0 = Sunday … 6 = Saturday. */
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  openWeekdays!: number[];

  /** Minimum notice before a slot can be requested. */
  @IsInt()
  @Min(0)
  @Max(2160)
  leadTimeHours!: number;

  /** How far ahead the calendar can be booked. */
  @IsInt()
  @Min(1)
  @Max(1095)
  horizonDays!: number;

  /** Planner's fixed UTC offset in minutes (240 = GMT+4). */
  @IsInt()
  @Min(-720)
  @Max(840)
  timezoneOffsetMinutes!: number;

  /** Shown next to every time on the public site, e.g. 'GMT+4'. */
  @IsString()
  @MaxLength(32)
  timezoneLabel!: string;
}
