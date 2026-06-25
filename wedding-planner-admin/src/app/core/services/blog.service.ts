import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BlogPost } from '../models/blog-post.model';

export interface BlogPostPayload {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  published?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>('/api/blog/admin/all');
  }

  getById(id: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`/api/blog/admin/${id}`);
  }

  create(dto: BlogPostPayload): Observable<BlogPost> {
    return this.http.post<BlogPost>('/api/blog', dto);
  }

  update(id: string, dto: Partial<BlogPostPayload>): Observable<BlogPost> {
    return this.http.patch<BlogPost>(`/api/blog/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/blog/${id}`);
  }
}
