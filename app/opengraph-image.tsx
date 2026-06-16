import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Vineeth Reddy Kodakandla — AI/ML Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0B0F17",
          color: "#EAF0F7",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: "#46D6C5",
            fontSize: "26px",
            letterSpacing: "5px",
          }}
        >
          OPEN TO WORK · AI/ML · FORWARD DEPLOYED
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "84px",
            fontWeight: 800,
            marginTop: "28px",
            lineHeight: 1.04,
          }}
        >
          AI that works after the demo.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "34px",
            color: "#9AA8B9",
            marginTop: "30px",
          }}
        >
          Vineeth Reddy Kodakandla — multi-agent platforms · RAG · MLOps
        </div>
      </div>
    ),
    { ...size }
  );
}
