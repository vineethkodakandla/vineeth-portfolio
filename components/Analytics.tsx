"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// One best-effort pageview beacon per route, including client-side navigations
// (the layout does not remount between pages). Never blocks rendering.
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    const body = JSON.stringify({ type: "pageview", path: pathname });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
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
  }, [pathname]);

  return null;
}
