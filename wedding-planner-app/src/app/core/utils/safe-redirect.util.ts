/**
 * Returns a safe, app-internal redirect path. Guards against open-redirect
 * attacks (e.g. `//evil.com`, `https://evil.com`, `/\evil.com`) by only allowing
 * paths that begin with a single `/` followed by a non-slash, non-backslash char.
 * Anything else falls back to the provided default.
 */
export function safeInternalRedirect(target: string | null | undefined, fallback = '/'): string {
  if (!target || !target.startsWith('/')) {
    return fallback;
  }
  // Reject protocol-relative ("//host") and backslash tricks ("/\\host").
  if (target.length > 1 && (target[1] === '/' || target[1] === '\\')) {
    return fallback;
  }
  return target;
}
