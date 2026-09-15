import * as Sentry from "@sentry/nextjs";

// DSN-guarded: no DSN => no-op.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: true,
    // No request headers (user agent, Vercel geolocation) or cookies on events.
    integrations: [Sentry.requestDataIntegration({ include: { headers: false, cookies: false } })],
  });
}
