import { isPlatformServer } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';

const SERVER_API_BASE_URL = 'http://localhost:3000';

/**
 * Relative `/api/...` calls work in the browser via the dev proxy / same-origin
 * deployment, but Node's fetch implementation (used for SSR) cannot resolve
 * relative URLs. On the server, prefix API requests with an absolute base URL.
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId) && req.url.startsWith('/api')) {
    const baseUrl = process.env['API_URL'] ?? SERVER_API_BASE_URL;
    return next(req.clone({ url: `${baseUrl}${req.url}` }));
  }

  return next(req);
};
