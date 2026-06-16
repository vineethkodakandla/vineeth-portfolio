import * as Sentry from "@sentry/nextjs";

// DSN-guarded: with no DSN this init is a harmless no-op and nothing is sent.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: true,
  });
}
