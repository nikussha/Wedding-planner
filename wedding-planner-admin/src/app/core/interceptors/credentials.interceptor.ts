import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/')) {
    return next(req.clone({ withCredentials: true }));
  }
  return next(req);
};
