import { trackLimiter, checkLimit } from "@/lib/ratelimit";
import { trackBodySchema } from "@/lib/validation";
import { recordPageView, incrProjectView } from "@/lib/analytics";

export const runtime = "nodejs";

// Best-effort analytics ingestion. Always returns 204 and never blocks the page.
export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const allowed = await checkLimit(trackLimiter, ip, 60, "track");
  if (!allowed) return new Response(null, { status: 204 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const parsed = trackBodySchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 204 });

  const country = req.headers.get("x-vercel-ip-country");
  const referrer = req.headers.get("referer");

  try {
    if (parsed.data.type === "pageview") {
      await recordPageView(parsed.data.path || "/", referrer, country);
    } else if (parsed.data.type === "project" && parsed.data.id) {
      await incrProjectView(parsed.data.id);
    }
  } catch {
    /* best-effort */
  }

  return new Response(null, { status: 204 });
}
