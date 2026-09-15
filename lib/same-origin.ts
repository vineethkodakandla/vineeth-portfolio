// Rejects cross-site POSTs to the chat and contact routes, so another page cannot
// make its visitors' browsers spend the model budget or send contact emails.
//
// Requiring a JSON content type forces a CORS preflight for cross-origin fetches,
// which fails because these routes send no CORS headers. Sec-Fetch-Site and
// Origin cover the rest, the same checks Next applies to Server Actions.
export function crossSiteRejection(req: Request): Response | null {
  const type = (req.headers.get("content-type") ?? "").trim().toLowerCase();
  if (!type.startsWith("application/json")) {
    return new Response("Unsupported Media Type", { status: 415 });
  }

  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") {
    return new Response("Forbidden", { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    try {
      if (!host || new URL(origin).host !== host) return new Response("Forbidden", { status: 403 });
    } catch {
      return new Response("Forbidden", { status: 403 });
    }
  }
  return null;
}
