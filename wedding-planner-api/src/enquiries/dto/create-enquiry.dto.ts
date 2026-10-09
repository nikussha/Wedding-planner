import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { DATE_KEY_MESSAGE, DATE_KEY_REGEX } from '../../availability/slots.util';

/**
 * Six fields, deliberately. Form length is the dominant factor in enquiry
 * conversion, so anything that can be asked on the call is not asked here.
 */
export class CreateEnquiryDto {
  /** Both partners in one field, as couples write it themselves. */
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  names!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  /** Optional: most couples enquire before they have fixed a date. */
  @IsOptional()
  @Matches(DATE_KEY_REGEX, { message: DATE_KEY_MESSAGE })
  weddingDate?: string;

  /** Venue or region, free text - often "not booked yet". */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;
}
