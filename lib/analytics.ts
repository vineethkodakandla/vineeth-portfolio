import { sql } from "@/lib/db";
import { redis } from "@/lib/ratelimit";

// Project ids that have a view counter on the page.
export const PROJECTS = ["edith", "pathwise", "pathfinders"] as const;
export type Counts = { site: number; projects: Record<string, number> };

// Page view: full event log in Postgres (for analytics), hot total in Redis.
export async function recordPageView(
  path: string,
  referrer: string | null,
  country: string | null
): Promise<void> {
  if (sql) {
    try {
      await sql`INSERT INTO page_views (path, referrer, country)
                VALUES (${path}, ${referrer}, ${country})`;
    } catch {
      /* best-effort */
    }
  }
  if (redis) {
    try {
      await redis.incr("views:site:total");
    } catch {
      /* best-effort */
    }
  }
}

// Project view: atomic Redis INCR is the source of truth; mirror into Postgres
// so the number survives a Redis flush. Without Redis, count straight in Postgres.
export async function incrProjectView(id: string): Promise<void> {
  if (!(PROJECTS as readonly string[]).includes(id)) return;
  if (redis) {
    try {
      const n = await redis.incr(`views:project:${id}`);
      if (sql) {
        try {
          await sql`INSERT INTO view_counts (key, count, updated_at)
                    VALUES (${`project:${id}`}, ${n}, now())
                    ON CONFLICT (key) DO UPDATE
                      SET count = GREATEST(view_counts.count, EXCLUDED.count),
                          updated_at = now()`;
        } catch {
          /* mirror is best-effort */
        }
      }
      return;
    } catch {
      /* fall through to Postgres-only */
    }
  }
  if (sql) {
    try {
      await sql`INSERT INTO view_counts (key, count, updated_at)
                VALUES (${`project:${id}`}, 1, now())
                ON CONFLICT (key) DO UPDATE
                  SET count = view_counts.count + 1, updated_at = now()`;
    } catch {
      /* best-effort */
    }
  }
}

export async function readCounts(): Promise<Counts> {
  const projects: Record<string, number> = {};
  let site = 0;

  if (redis) {
    try {
      const keys = ["views:site:total", ...PROJECTS.map((p) => `views:project:${p}`)];
      const vals = await redis.mget<(number | string | null)[]>(...keys);
      site = Number(vals[0] || 0);
      PROJECTS.forEach((p, i) => {
        projects[p] = Number(vals[i + 1] || 0);
      });
      return { site, projects };
    } catch {
      /* fall through to Postgres */
    }
  }

  if (sql) {
    try {
      const rows = await sql`SELECT key, count FROM view_counts WHERE key LIKE 'project:%'`;
      const map = new Map(rows.map((r: any) => [r.key, Number(r.count)]));
      PROJECTS.forEach((p) => {
        projects[p] = map.get(`project:${p}`) || 0;
      });
      const sv = await sql`SELECT count(*)::int AS c FROM page_views`;
      site = Number((sv as any)[0]?.c || 0);
      return { site, projects };
    } catch {
      /* fall through to zeros */
    }
  }

  PROJECTS.forEach((p) => {
    projects[p] = 0;
  });
  return { site, projects };
}
