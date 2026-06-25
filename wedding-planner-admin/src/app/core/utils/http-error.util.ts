import { HttpErrorResponse } from '@angular/common/http';

export function extractErrorMessage(err: HttpErrorResponse, fallback: string): string {
  const message = err.error?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  if (typeof message === 'string') {
    return message;
  }

  return fallback;
}
