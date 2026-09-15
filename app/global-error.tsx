"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Loaded on demand so the Sentry SDK is not part of every page's bundle.
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    import("@sentry/nextjs")
      .then((Sentry) => Sentry.captureException(error))
      .catch(() => {});
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fafaf7",
          color: "#16181d",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Something went wrong.</h1>
          <p style={{ color: "#474c55", margin: 0 }}>
            Please refresh the page. If it keeps happening, email vineethkodakandla@gmail.com.
          </p>
        </div>
      </body>
    </html>
  );
}
