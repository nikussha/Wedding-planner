import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Ensures auth cookies are sent with same-origin/proxied API requests.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/')) {
    return next(req.clone({ withCredentials: true }));
  }

  return next(req);
};
