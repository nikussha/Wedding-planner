import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { catchError, of } from 'rxjs';

import { routes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.fetchMe().pipe(catchError(() => of(null)));
    }),
  ],
};
