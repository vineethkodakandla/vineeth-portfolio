import type { MetadataRoute } from "next";
import { CASE_STUDIES } from "@/content/case-studies";
import { SITE } from "@/content/site";

// Fixed date: the day the content was last checked, not the build time, so
// crawlers are not told every deploy changed every page.
const REVIEWED = new Date("2026-09-15T00:00:00Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, lastModified: REVIEWED, changeFrequency: "monthly", priority: 1 },
    ...CASE_STUDIES.map((c) => ({
      url: `${SITE.url}/work/${c.slug}`,
      lastModified: REVIEWED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
