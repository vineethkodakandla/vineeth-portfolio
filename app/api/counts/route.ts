import { readCounts } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const counts = await readCounts();
  return Response.json(counts, {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
  });
}
