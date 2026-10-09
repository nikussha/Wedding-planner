import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Enquiry, EnquiryStatus } from '../models/enquiry.model';

@Injectable({ providedIn: 'root' })
export class EnquiriesService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Enquiry[]> {
    return this.http.get<Enquiry[]>('/api/enquiries');
  }

  updateStatus(id: string, status: EnquiryStatus): Observable<Enquiry> {
    return this.http.patch<Enquiry>(`/api/enquiries/${id}`, { status });
  }

  remove(id: string): Observable<Enquiry> {
    return this.http.delete<Enquiry>(`/api/enquiries/${id}`);
  }
}
