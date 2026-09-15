import { createHash, createHmac } from "node:crypto";
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

// Keys the rate-limit id. It must be the same on every instance and deploy, or
// Upstash limits stop being per client; changing it only resets the counters.
const RATE_LIMIT_SECRET = process.env.RATE_LIMIT_SECRET;
if (hasRedis && !RATE_LIMIT_SECRET && process.env.VERCEL_ENV === "production") {
  console.warn("RATE_LIMIT_SECRET is not set: rate-limit ids are an unkeyed hash of the client IP");
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

/** The id a client IP is counted under: never the address itself. */
function rateLimitId(ip: string): string {
  const mac = RATE_LIMIT_SECRET
    ? createHmac("sha256", RATE_LIMIT_SECRET).update(ip)
    : createHash("sha256").update(`rate-limit:${ip}`);
  return mac.digest("hex").slice(0, 32);
}

/**
 * Returns true if the request is ALLOWED, false if rate-limited.
 * Uses Upstash when available, otherwise the in-memory fallback, whose window
 * should match the limiter's (for example one hour for the contact form).
 *
 * The key is a client IP. Only its HMAC (under RATE_LIMIT_SECRET) reaches Redis
 * or the in-memory map, and Upstash counters expire within twice their window.
 */
export async function checkLimit(
  limiter: Ratelimit | null,
  key: string,
  fallbackMax: number,
  bucket = "default",
  fallbackWindowMs = 60_000
): Promise<boolean> {
  const id = rateLimitId(key);
  if (limiter) {
    const { success } = await limiter.limit(id);
    return success;
  }
  // Namespace the fallback by bucket so different endpoints don't share a counter
  // (Upstash limiters already namespace via their `prefix`).
  return !memoryLimited(`${bucket}:${id}`, fallbackMax, fallbackWindowMs);
}
