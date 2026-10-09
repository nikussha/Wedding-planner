import { Matches } from 'class-validator';
import { DATE_KEY_MESSAGE, DATE_KEY_REGEX } from '../slots.util';

export class CalendarQueryDto {
  /** First calendar date to return, as 'YYYY-MM-DD'. */
  @Matches(DATE_KEY_REGEX, { message: DATE_KEY_MESSAGE })
  from!: string;

  /** Last calendar date to return, as 'YYYY-MM-DD'. */
  @Matches(DATE_KEY_REGEX, { message: DATE_KEY_MESSAGE })
  to!: string;
}
