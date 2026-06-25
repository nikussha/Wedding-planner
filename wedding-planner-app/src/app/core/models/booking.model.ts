export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: string;
  userId: string;
  eventDate: string;
  message: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}
