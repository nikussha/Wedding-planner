export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: string;
  userId: string;
  /** Start of the booked slot, as a UTC instant. */
  slotStart: string;
  /** End of the booked slot, as a UTC instant. */
  slotEnd: string;
  message: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}
