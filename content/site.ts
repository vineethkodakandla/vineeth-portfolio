// Identity and site-wide constants. Job titles and employment claims live in
// content/experience.ts, not here.

export const SITE = {
  name: "Vineeth Reddy Kodakandla",
  role: "ML engineer",
  location: "United States",
  email: "vineethkodakandla@gmail.com",
  github: "https://github.com/vineethkodakandla",
  linkedin: "https://www.linkedin.com/in/vineethkodakandla",
  source: "https://github.com/vineethkodakandla/vineeth-portfolio",
  // Production sets NEXT_PUBLIC_SITE_URL. Preview deployments do not, so fall
  // back to Vercel's production hostname rather than emitting localhost links.
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  ).replace(/\/$/, ""),
  // Bump when the content is re-checked against the source repositories.
  reviewed: "15 September 2026",
  description:
    "ML engineer working on model inference and evaluation. Public, measured projects on LLM serving reproducibility, edge inference latency and nightly LLM evaluation, with every result linked to its data.",
} as const;

export const NAV = [
  { label: "Work", href: "/#work" },
  { label: "Experience", href: "/#experience" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
] as const;
