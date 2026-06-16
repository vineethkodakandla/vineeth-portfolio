import * as Sentry from "@sentry/nextjs";
import { sql } from "@/lib/db";
import { contactLimiter, checkLimit } from "@/lib/ratelimit";
import { contactBodySchema } from "@/lib/validation";
import { sendContactEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const allowed = await checkLimit(contactLimiter, ip, 5, "contact");
  if (!allowed) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const parsed = contactBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Honeypot tripped → silently accept without doing anything (don't tip off bots).
  if (parsed.data.company) {
    return Response.json({ ok: true, persisted: false, emailed: false });
  }

  const { name, email, message } = parsed.data;
  const ua = req.headers.get("user-agent") || "";

  let id: number | null = null;
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO contact_submissions (name, email, message, ip, user_agent)
        VALUES (${name}, ${email}, ${message}, ${ip}, ${ua})
        RETURNING id`;
      id = (rows as any)[0]?.id ?? null;
    } catch (e) {
      Sentry.captureException(e);
    }
  }

  const emailed = await sendContactEmail({ name, email, message });

  if (id != null && emailed && sql) {
    try {
      await sql`UPDATE contact_submissions SET email_sent = true WHERE id = ${id}`;
    } catch {
      /* non-critical */
    }
  }

  const ok = id != null || emailed;
  return Response.json(
    { ok, persisted: id != null, emailed },
    { status: ok ? 200 : 500 }
  );
}
