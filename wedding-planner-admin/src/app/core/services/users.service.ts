import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Role, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  updateRole(id: string, role: Role): Observable<User> {
    return this.http.patch<User>(`/api/users/${id}/role`, { role });
  }
}
