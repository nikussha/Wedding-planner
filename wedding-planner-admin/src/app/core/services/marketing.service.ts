import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** Fields every editable list row shares. */
export interface MarketingListItem {
  id: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  /** Resource-specific fields: question/answer, name/forWho, and so on. */
  [field: string]: unknown;
}

/** The API path segment for each editable list. */
export type MarketingResource = 'faq' | 'testimonials' | 'process' | 'service-tiers';

@Injectable({ providedIn: 'root' })
export class MarketingService {
  private readonly http = inject(HttpClient);

  list(resource: MarketingResource): Observable<MarketingListItem[]> {
    return this.http.get<MarketingListItem[]>(`/api/marketing/${resource}`);
  }

  create(resource: MarketingResource, data: Record<string, unknown>): Observable<MarketingListItem> {
    return this.http.post<MarketingListItem>(`/api/marketing/${resource}`, data);
  }

  update(
    resource: MarketingResource,
    id: string,
    data: Record<string, unknown>,
  ): Observable<MarketingListItem> {
    return this.http.patch<MarketingListItem>(`/api/marketing/${resource}/${id}`, data);
  }

  remove(resource: MarketingResource, id: string): Observable<unknown> {
    return this.http.delete(`/api/marketing/${resource}/${id}`);
  }

  /** The full id list in its new display order. */
  reorder(resource: MarketingResource, ids: string[]): Observable<{ updated: number }> {
    return this.http.put<{ updated: number }>(`/api/marketing/${resource}/order`, { ids });
  }
}
