import { createHash } from "node:crypto";
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

// No `analytics` option: Upstash analytics keeps a log of identifiers, and the
// site does not keep visitor addresses.
export const chatLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(12, "60 s"),
      prefix: "rl:chat",
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
 *
 * The key is a client IP. It is hashed before use, so raw addresses never reach
 * Redis or the in-memory map, and the counters expire with their window.
 */
export async function checkLimit(
  limiter: Ratelimit | null,
  key: string,
  fallbackMax: number,
  bucket = "default"
): Promise<boolean> {
  const id = createHash("sha256").update(`rate-limit:${key}`).digest("hex").slice(0, 32);
  if (limiter) {
    const { success } = await limiter.limit(id);
    return success;
  }
  // Namespace the fallback by bucket so different endpoints don't share a counter
  // (Upstash limiters already namespace via their `prefix`).
  return !memoryLimited(`${bucket}:${id}`, fallbackMax);
}
