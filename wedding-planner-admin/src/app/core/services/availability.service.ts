import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AvailabilitySetting,
  BlockedDate,
  UpdateAvailabilitySettingsPayload,
} from '../models/availability.model';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly http = inject(HttpClient);

  getSettings(): Observable<AvailabilitySetting> {
    return this.http.get<AvailabilitySetting>('/api/availability/settings');
  }

  updateSettings(payload: UpdateAvailabilitySettingsPayload): Observable<AvailabilitySetting> {
    return this.http.put<AvailabilitySetting>('/api/availability/settings', payload);
  }

  listBlockedDates(): Observable<BlockedDate[]> {
    return this.http.get<BlockedDate[]>('/api/availability/blocked-dates');
  }

  /** `date` is a calendar date as 'YYYY-MM-DD'. */
  addBlockedDate(date: string, reason?: string): Observable<BlockedDate> {
    return this.http.post<BlockedDate>('/api/availability/blocked-dates', { date, reason });
  }

  removeBlockedDate(id: string): Observable<BlockedDate> {
    return this.http.delete<BlockedDate>(`/api/availability/blocked-dates/${id}`);
  }
}
