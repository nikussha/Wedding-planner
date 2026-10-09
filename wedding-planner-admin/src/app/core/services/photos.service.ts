import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Photo } from '../models/photo.model';

export interface UpdatePhotoPayload {
  alt?: string;
  caption?: string;
  order?: number;
}

@Injectable({ providedIn: 'root' })
export class PhotosService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Photo[]> {
    return this.http.get<Photo[]>('/api/photos');
  }

  upload(file: File, alt?: string, caption?: string): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);
    if (alt) {
      formData.append('alt', alt);
    }
    if (caption) {
      formData.append('caption', caption);
    }
    return this.http.post<Photo>('/api/photos', formData);
  }

  update(id: string, dto: UpdatePhotoPayload): Observable<Photo> {
    return this.http.patch<Photo>(`/api/photos/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/photos/${id}`);
  }
}
