import { sql, dbReady } from "@/lib/db";
import { redis, redisReady } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness + dependency probe. No secrets in the body — just booleans.
export async function GET() {
  const checks: Record<string, boolean> = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    voyage: !!process.env.VOYAGE_API_KEY,
    resend: !!process.env.RESEND_API_KEY,
    sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    db: false,
    redis: false,
  };

  if (dbReady() && sql) {
    try {
      await sql`SELECT 1`;
      checks.db = true;
    } catch {
      /* db unreachable */
    }
  }

  if (redisReady() && redis) {
    try {
      await redis.ping();
      checks.redis = true;
    } catch {
      /* redis unreachable */
    }
  }

  // The site's one load-bearing dependency is the chat key; everything else
  // degrades gracefully, so health is "ok" as long as that's present.
  const ok = checks.anthropic;
  return Response.json(
    { status: ok ? "ok" : "degraded", checks },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
