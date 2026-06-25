import { HttpInterceptorFn } from '@angular/common/http';
import { inject, REQUEST } from '@angular/core';

/**
 * During SSR, the Angular server has no browser cookie jar of its own.
 * Forward the incoming request's `Cookie` header onto outgoing API calls so
 * the API can resolve the visitor's auth state for the initial render.
 */
export const ssrCookieInterceptor: HttpInterceptorFn = (req, next) => {
  const incomingRequest = inject(REQUEST, { optional: true });
  const cookie = incomingRequest?.headers.get('cookie');

  if (cookie && req.url.includes('/api/')) {
    return next(req.clone({ setHeaders: { cookie } }));
  }

  return next(req);
};
