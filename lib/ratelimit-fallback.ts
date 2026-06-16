// In-memory sliding-window limiter. Used only when Upstash isn't configured
// (local dev, or before keys are added). Resets on cold start and isn't shared
// across serverless instances — fine as a local fallback, not for production.

const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

/** Returns true if the key is OVER the limit (i.e. should be blocked). */
export function memoryLimited(key: string, max: number, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
}
