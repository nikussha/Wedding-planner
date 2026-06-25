import { createHash, randomBytes } from 'node:crypto';

/**
 * Generates a high-entropy opaque refresh token (not a JWT).
 * Only its SHA-256 hash is persisted, so a leaked DB never exposes usable tokens.
 */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
