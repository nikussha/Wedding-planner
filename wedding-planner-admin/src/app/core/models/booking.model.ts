export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: string;
  userId: string;
  /** Start of the requested slot, as a UTC instant. */
  slotStart: string;
  /** End of the requested slot, as a UTC instant. */
  slotEnd: string;
  message: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Confirming a request also declines the rival requests for the same slot;
 * `supersededCount` says how many people that affected.
 */
export interface BookingStatusChange extends Booking {
  supersededCount: number;
}
