import { ImageResponse } from "next/og";
import { Card } from "@/app/opengraph-image";
import { CASE_STUDIES } from "@/content/case-studies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Case study by Vineeth Reddy Kodakandla";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CaseStudyImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cs = CASE_STUDIES.find((c) => c.slug === slug);
  return new ImageResponse(
    (
      <Card
        eyebrow={`Case study | ${cs?.kicker ?? "Vineeth Reddy Kodakandla"}`}
        title={cs?.title ?? "Case study"}
        subtitle={cs?.description ?? ""}
      />
    ),
    { ...size },
  );
}
