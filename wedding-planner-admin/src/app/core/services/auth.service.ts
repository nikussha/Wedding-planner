import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

interface MeResponse {
  user: User | null;
}

interface AuthResponse {
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly userSignal = signal<User | null>(null);
  private readonly initializedSignal = signal(false);

  readonly user = this.userSignal.asReadonly();
  readonly initialized = this.initializedSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly isAdmin = computed(() => this.userSignal()?.role === 'ADMIN');

  fetchMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>('/api/auth/me').pipe(
      tap((res) => {
        this.userSignal.set(res.user);
        this.initializedSignal.set(true);
      }),
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((res) => this.userSignal.set(res.user)));
  }

  logout(): Observable<{ success: boolean }> {
    return this.http
      .post<{ success: boolean }>('/api/auth/logout', {})
      .pipe(tap(() => this.userSignal.set(null)));
  }
}
