import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsISO8601()
  eventDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
