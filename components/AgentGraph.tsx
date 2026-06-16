"use client";
import { useEffect, useRef } from "react";

type Node = { id: string; x: number; y: number; r: number; label: string; kind: string };

export default function AgentGraph() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0;
    const mouse = { x: -999, y: -999 };

    const nodes: Node[] = [
      { id: "orch", x: 0.5, y: 0.5, r: 13, label: "Orchestrator", kind: "core" },
      { id: "a1", x: 0.22, y: 0.24, r: 9, label: "Agent", kind: "agent" },
      { id: "a2", x: 0.8, y: 0.22, r: 9, label: "Agent", kind: "agent" },
      { id: "a3", x: 0.84, y: 0.66, r: 9, label: "Agent", kind: "agent" },
      { id: "mem", x: 0.16, y: 0.62, r: 10, label: "Memory", kind: "data" },
      { id: "rag", x: 0.3, y: 0.84, r: 10, label: "RAG", kind: "data" },
      { id: "tool", x: 0.62, y: 0.84, r: 9, label: "Tools", kind: "data" },
      { id: "val", x: 0.62, y: 0.18, r: 9, label: "Validator", kind: "guard" },
      { id: "tel", x: 0.9, y: 0.44, r: 7, label: "Telemetry", kind: "data" },
    ];
    const edges = [
      ["orch", "a1"], ["orch", "a2"], ["orch", "a3"], ["orch", "val"],
      ["a1", "mem"], ["a1", "rag"], ["a2", "tool"], ["a2", "val"],
      ["a3", "tool"], ["a3", "tel"], ["mem", "rag"], ["orch", "tel"],
    ];
    const nmap: Record<string, Node> = {};
    nodes.forEach((n) => (nmap[n.id] = n));
    const pulses = edges.map((e) => ({
      e, t: Math.random(), speed: 0.0016 + Math.random() * 0.0022, on: Math.random() > 0.35,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -999; mouse.y = -999; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const px = (n: Node) => ({ x: n.x * W, y: n.y * H });
    const t0 = performance.now();

    const frame = (now: number) => {
      const time = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      edges.forEach((e) => {
        const a = px(nmap[e[0]]), b = px(nmap[e[1]]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(35,48,63,.9)"; ctx.lineWidth = 1; ctx.stroke();
      });

      if (!reduce) {
        pulses.forEach((p) => {
          if (!p.on) return;
          p.t += p.speed;
          if (p.t > 1) { p.t = 0; p.on = Math.random() > 0.25; }
          const a = px(nmap[p.e[0]]), b = px(nmap[p.e[1]]);
          const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
          const g = ctx.createRadialGradient(x, y, 0, x, y, 5);
          g.addColorStop(0, "rgba(70,214,197,.95)");
          g.addColorStop(1, "rgba(70,214,197,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.fill();
        });
      }

      nodes.forEach((n) => {
        const p = px(n);
        const fl = reduce ? 0 : Math.sin(time * 1.1 + n.x * 9) * 1.4;
        p.y += fl;
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const near = Math.max(0, 1 - dist / 120);
        const R = n.r + near * 4;

        if (near > 0.02 || n.kind === "core") {
          const base = n.kind === "core" ? 0.5 : near * 0.9;
          const col = n.kind === "guard" ? "255,180,84" : "70,214,197";
          const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R + 22);
          gg.addColorStop(0, `rgba(${col},${0.22 * base})`);
          gg.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p.x, p.y, R + 22, 0, 6.283); ctx.fill();
        }

        const fill = n.kind === "core" ? "#46D6C5"
          : n.kind === "guard" ? "#FFB454"
          : near > 0.1 ? "#46D6C5" : "#2A3848";
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 6.283);
        ctx.fillStyle = fill; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(11,15,23,.9)"; ctx.stroke();

        if (near > 0.25 || n.kind === "core") {
          ctx.font = '500 11px var(--font-mono), monospace';
          ctx.fillStyle = `rgba(234,240,247,${n.kind === "core" ? 0.85 : near})`;
          ctx.textAlign = "center";
          ctx.fillText(n.label, p.x, p.y - R - 8);
        }
      });

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" />;
}
