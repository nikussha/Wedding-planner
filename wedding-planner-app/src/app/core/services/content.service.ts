import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SiteContentMap } from '../models/content.model';
import { Photo } from '../models/photo.model';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);

  getSiteContent(): Observable<SiteContentMap> {
    return this.http.get<SiteContentMap>('/api/content');
  }

  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>('/api/photos');
  }
}
