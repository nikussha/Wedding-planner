import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { extractErrorMessage } from '../utils/http-error.util';
import { NotificationService } from '../services/notification.service';

/**
 * Surfaces failed API requests to the user via a toast, then re-throws so
 * component-level handlers can still react (e.g. revert optimistic updates).
 *
 * 401s are skipped: those are handled by the auth flow / route guards and would
 * otherwise spam a toast on every unauthenticated `auth/me` probe.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status !== 401) {
        notifications.error(extractErrorMessage(error, 'Something went wrong. Please try again.'));
      }
      return throwError(() => error);
    }),
  );
};
