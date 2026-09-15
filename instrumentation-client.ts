// Sentry's browser SDK is loaded only when a DSN is configured, so deployments
// without Sentry do not ship it in every page's JavaScript.

type NavigationType = "push" | "replace" | "traverse";
let transitionHook: ((href: string, navigationType: NavigationType) => void) | undefined;

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
      });
      transitionHook = Sentry.captureRouterTransitionStart;
    })
    .catch(() => {
      /* monitoring is optional */
    });
}

export function onRouterTransitionStart(href: string, navigationType: NavigationType) {
  transitionHook?.(href, navigationType);
}
