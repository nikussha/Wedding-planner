const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Converts durations like "15m" or "7d" to milliseconds.
 */
export function durationToMs(duration: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration string: "${duration}"`);
  }

  const [, value, unit] = match;
  return Number(value) * UNIT_MS[unit];
}
