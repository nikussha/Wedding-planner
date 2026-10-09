import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AvailabilityCalendar, AvailabilitySettings, DateKey } from '../models/availability.model';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly http = inject(HttpClient);

  /** Public, anonymous slot availability between two calendar dates. */
  getCalendar(from: DateKey, to: DateKey): Observable<AvailabilityCalendar> {
    return this.http.get<AvailabilityCalendar>('/api/availability/calendar', {
      params: { from, to },
    });
  }

  /**
   * The planner's opening hours. Pages that describe the consultation read
   * the length from here rather than hardcoding it, so prose can never
   * contradict the calendar.
   */
  getSettings(): Observable<AvailabilitySettings> {
    return this.http.get<AvailabilitySettings>('/api/availability/settings');
  }
}
