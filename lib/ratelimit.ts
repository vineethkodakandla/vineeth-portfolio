import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { memoryLimited } from "./ratelimit-fallback";

// Durable, cross-instance rate limiting via Upstash Redis. Null when unconfigured
// so callers transparently fall back to the in-memory limiter.
const hasRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

export const redis = hasRedis ? Redis.fromEnv() : null;
export function redisReady(): boolean {
  return redis !== null;
}

export const chatLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(12, "60 s"),
      prefix: "rl:chat",
      analytics: true,
    })
  : null;

export const contactLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "rl:contact",
    })
  : null;

export const trackLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      prefix: "rl:track",
    })
  : null;

/**
 * Returns true if the request is ALLOWED, false if rate-limited.
 * Uses Upstash when available, otherwise the in-memory fallback.
 */
export async function checkLimit(
  limiter: Ratelimit | null,
  key: string,
  fallbackMax: number,
  bucket = "default"
): Promise<boolean> {
  if (limiter) {
    const { success } = await limiter.limit(key);
    return success;
  }
  // Namespace the fallback by bucket so different endpoints don't share a counter
  // (Upstash limiters already namespace via their `prefix`).
  return !memoryLimited(`${bucket}:${key}`, fallbackMax);
}
