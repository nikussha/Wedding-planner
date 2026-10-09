import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SiteContentMap, SiteContentEntry } from '../models/content.model';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<SiteContentMap> {
    return this.http.get<SiteContentMap>('/api/content');
  }

  upsert(key: string, dto: Partial<SiteContentEntry>): Observable<unknown> {
    return this.http.put(`/api/content/${key}`, dto);
  }
}
