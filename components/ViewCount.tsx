"use client";
import { useEffect, useRef, useState } from "react";

// Module-level cache so all badges share a single /api/counts fetch.
let cache: { site: number; projects: Record<string, number> } | null = null;
let inflight: Promise<any> | null = null;

async function getCounts() {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch("/api/counts")
      .then((r) => r.json())
      .then((d) => (cache = d))
      .catch(() => ({ site: 0, projects: {} }));
  }
  return inflight;
}

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function track(projectId: string) {
  const body = JSON.stringify({ type: "project", id: projectId });
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
    /* best-effort */
  }
}

export default function ViewCount({ projectId }: { projectId?: string }) {
  const [n, setN] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  // Read the count.
  useEffect(() => {
    let alive = true;
    getCounts().then((c) => {
      if (!alive) return;
      setN(projectId ? (c.projects?.[projectId] ?? 0) : (c.site ?? 0));
    });
    return () => {
      alive = false;
    };
  }, [projectId]);

  // Increment a project view when its card first scrolls into view (once/session).
  useEffect(() => {
    if (!projectId) return;
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const key = `viewed:project:${projectId}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* sessionStorage may be unavailable */
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            io.disconnect();
            try {
              sessionStorage.setItem(key, "1");
            } catch {
              /* ignore */
            }
            track(projectId);
          }
        });
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [projectId]);

  return (
    <span className="viewcount" ref={ref}>
      {n == null ? "—" : `${fmt(n)} views`}
    </span>
  );
}
