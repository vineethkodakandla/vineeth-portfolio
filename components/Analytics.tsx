"use client";
import { useEffect } from "react";

// Fires one best-effort pageview beacon on mount. Never blocks render.
export default function Analytics() {
  useEffect(() => {
    const body = JSON.stringify({
      type: "pageview",
      path: window.location.pathname,
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/track",
          new Blob([body], { type: "application/json" })
        );
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    } catch {
      /* analytics is best-effort */
    }
  }, []);
  return null;
}
