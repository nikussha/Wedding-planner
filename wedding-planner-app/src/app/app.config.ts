import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { catchError, of } from 'rxjs';

import { routes } from './app.routes';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { ssrCookieInterceptor } from './core/interceptors/ssr-cookie.interceptor';
import { AuthService } from './core/services/auth.service';
import { MarketingStore } from './core/services/marketing.store';
import { SiteContentStore } from './core/services/site-content.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([ssrCookieInterceptor, apiBaseUrlInterceptor, credentialsInterceptor]),
    ),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.fetchMe().pipe(catchError(() => of(null)));
    }),
    // Site text is needed by the header and footer on every page, so it is
    // resolved before the first render rather than per page.
    provideAppInitializer(() => inject(SiteContentStore).load()),
    // The marketing lists (services, process, FAQ, testimonials) are needed by
    // the home and services pages on first paint.
    provideAppInitializer(() => inject(MarketingStore).load()),
  ],
};
