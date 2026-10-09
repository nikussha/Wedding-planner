import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  /**
   * Start of the requested slot as a UTC instant, exactly as the calendar
   * returned it. The server re-derives the slot grid and rejects anything that
   * is not a real, open, still-bookable slot.
   */
  @IsISO8601({ strict: true })
  slotStart!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
