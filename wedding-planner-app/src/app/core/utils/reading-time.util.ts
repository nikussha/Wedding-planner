/** Average adult silent reading speed for prose, in words per minute. */
const WORDS_PER_MINUTE = 200;

/**
 * Rough reading time in whole minutes, never less than one. Useful on advice
 * posts, where readers are deciding whether to start; less meaningful on a
 * photo-led write-up, where the pictures carry the time.
 */
export function readingMinutes(content: string | null | undefined): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
