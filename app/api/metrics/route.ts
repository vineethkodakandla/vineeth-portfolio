import { sql } from "@/lib/db";
import { readCounts } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Token-guarded aggregates. Set METRICS_TOKEN and call with
// Authorization: Bearer <token>. Without the token configured, returns 401.
export async function GET(req: Request) {
  const token = process.env.METRICS_TOKEN;
  const auth = req.headers.get("authorization") || "";
  if (!token || auth !== `Bearer ${token}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const counts = await readCounts();
  let contactCount = 0;
  let pageViews24h = 0;
  let topPaths: Array<{ path: string; c: number }> = [];

  if (sql) {
    try {
      const r = await sql`SELECT count(*)::int AS c FROM contact_submissions`;
      contactCount = (r as any)[0]?.c || 0;
    } catch {
      /* ignore */
    }
    try {
      const r = await sql`SELECT count(*)::int AS c FROM page_views
                          WHERE created_at > now() - interval '24 hours'`;
      pageViews24h = (r as any)[0]?.c || 0;
    } catch {
      /* ignore */
    }
    try {
      const r = await sql`SELECT path, count(*)::int AS c FROM page_views
                          GROUP BY path ORDER BY c DESC LIMIT 10`;
      topPaths = r as any;
    } catch {
      /* ignore */
    }
  }

  return Response.json(
    { counts, contactCount, pageViews24h, topPaths },
    { headers: { "Cache-Control": "no-store" } }
  );
}
