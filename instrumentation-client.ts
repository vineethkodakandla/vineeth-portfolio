// Sentry's browser SDK is loaded only when a DSN is configured, so deployments
// without Sentry do not ship it in every page's JavaScript.

type NavigationType = "push" | "replace" | "traverse";
let transitionHook: ((href: string, navigationType: NavigationType) => void) | undefined;

// The SDK adds the browser's User-Agent and Referer to every event's request
// headers; the site does not send visitor user agents, so they are removed.
const withoutHeaders = <E extends { request?: { headers?: Record<string, string> } }>(event: E): E => {
  if (event.request) delete event.request.headers;
  return event;
};

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        // Release-health sessions carry the user agent on every page view.
        integrations: (defaults) => defaults.filter((i) => i.name !== "BrowserSession"),
        beforeSend: withoutHeaders,
        beforeSendTransaction: withoutHeaders,
        // Spans record the user agent as an attribute.
        beforeSendSpan: (span) => {
          if (span.data) delete span.data["user_agent.original"];
          return span;
        },
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
