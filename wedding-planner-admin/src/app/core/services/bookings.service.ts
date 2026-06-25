import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking, BookingStatus } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Booking[]> {
    return this.http.get<Booking[]>('/api/bookings');
  }

  updateStatus(id: string, status: BookingStatus): Observable<Booking> {
    return this.http.patch<Booking>(`/api/bookings/${id}`, { status });
  }
}
