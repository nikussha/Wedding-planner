import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking } from '../models/booking.model';

export interface CreateBookingPayload {
  /** Slot start as a UTC instant, exactly as the calendar returned it. */
  slotStart: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  create(payload: CreateBookingPayload): Observable<Booking> {
    return this.http.post<Booking>('/api/bookings', payload);
  }

  mine(): Observable<Booking[]> {
    return this.http.get<Booking[]>('/api/bookings/me');
  }
}
