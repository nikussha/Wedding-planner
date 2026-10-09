import { IsIn } from 'class-validator';
import { BOOKING_STATUSES, BookingStatus } from '../../common/enums/booking-status.enum';

export class UpdateBookingStatusDto {
  @IsIn(BOOKING_STATUSES)
  status!: BookingStatus;
}
