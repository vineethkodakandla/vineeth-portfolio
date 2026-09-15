import { ImageResponse } from "next/og";

// Rendered on request: @vercel/og's WASM does not run under a local Windows
// build, and on Vercel a per-request render is cheap and cached by the CDN.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Vineeth Reddy Kodakandla, ML engineer: inference engineering, with the data attached";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function Card({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#fafaf7",
        color: "#16181d",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 26, color: "#6a6f78", letterSpacing: 1 }}>{eyebrow}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 74, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 32, color: "#474c55", marginTop: 28, lineHeight: 1.35 }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", fontSize: 24, color: "#6a6f78" }}>
        <div style={{ display: "flex", width: 56, height: 4, background: "#2a78d6", marginRight: 18 }} />
        Every measured result links to the file it came from
      </div>
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <Card
        eyebrow="Vineeth Reddy Kodakandla | ML engineer"
        title="Inference engineering, with the data attached."
        subtitle="Public measurement projects on LLM serving, edge inference latency and nightly LLM evaluation."
      />
    ),
    { ...size },
  );
}
