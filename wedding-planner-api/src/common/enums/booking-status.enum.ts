export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BOOKING_STATUSES = Object.values(BookingStatus) as BookingStatus[];
