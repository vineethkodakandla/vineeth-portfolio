import { neon } from "@neondatabase/serverless";

// Single shared serverless Postgres client (Neon).
//
// Uses Neon's HTTP query function — no long-lived TCP pool — which is the right
// model for Vercel's short-lived serverless invocations (a classic pg Pool
// would exhaust connection limits and add cold-start latency).
//
// `sql` is null when DATABASE_URL is absent so every caller can degrade
// gracefully (fall back to the JSON knowledge base, skip persistence, etc.)
// instead of crashing the build or a request.
// `cache: "no-store"` is important: the Neon HTTP driver uses fetch under the
// hood, and Next.js's Data Cache would otherwise serve stale query results.
export const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL, { fetchOptions: { cache: "no-store" } })
  : null;

export function dbReady(): boolean {
  return sql !== null;
}
