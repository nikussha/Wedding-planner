import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface EnquiryPayload {
  /** Both partners, as the couple writes it. */
  names: string;
  email: string;
  /** 'YYYY-MM-DD', omitted when the couple has no date yet. */
  weddingDate?: string;
  location?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class EnquiryService {
  private readonly http = inject(HttpClient);

  /** The API acknowledges receipt and returns nothing about the stored row. */
  send(payload: EnquiryPayload): Observable<{ received: boolean }> {
    return this.http.post<{ received: boolean }>('/api/enquiries', payload);
  }
}
