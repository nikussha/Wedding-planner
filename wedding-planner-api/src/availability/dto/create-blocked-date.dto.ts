import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { DATE_KEY_MESSAGE, DATE_KEY_REGEX } from '../slots.util';

export class CreateBlockedDateDto {
  /** Calendar date to close, as 'YYYY-MM-DD'. */
  @Matches(DATE_KEY_REGEX, { message: DATE_KEY_MESSAGE })
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
