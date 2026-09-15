import { redis } from "@/lib/ratelimit";

// A global daily ceiling on chat requests. The per-IP limiter stops one client;
// this stops many clients together from running up the model bill. Counted in
// Redis when it is configured. Without Redis each server instance allows a small
// number per day, which fails closed rather than trusting an unshared counter.
const DAILY_LIMIT = Number(process.env.CHAT_DAILY_LIMIT || 400);
const LOCAL_LIMIT = Math.min(DAILY_LIMIT, 100);

const local = new Map<string, number>();

export async function consumeChatBudget(): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);

  if (redis) {
    try {
      const key = `chat:budget:${day}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 36 * 60 * 60);
      return count <= DAILY_LIMIT;
    } catch {
      /* Redis unreachable: fall back to the per-instance allowance */
    }
  }

  if (!local.has(day)) local.clear();
  const count = (local.get(day) ?? 0) + 1;
  local.set(day, count);
  return count <= LOCAL_LIMIT;
}
