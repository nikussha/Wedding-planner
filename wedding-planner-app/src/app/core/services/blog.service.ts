import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BlogPost } from '../models/blog-post.model';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);

  list(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>('/api/blog');
  }

  getBySlug(slug: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`/api/blog/${slug}`);
  }
}
