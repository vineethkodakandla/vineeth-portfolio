import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CASE_STUDIES } from "@/content/case-studies";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cs = CASE_STUDIES.find((c) => c.slug === slug);
  if (!cs) return {};
  return {
    title: cs.title,
    description: cs.description,
    alternates: { canonical: `/work/${cs.slug}` },
    openGraph: { title: cs.title, description: cs.description, url: `/work/${cs.slug}`, type: "article" },
    twitter: { card: "summary_large_image", title: cs.title, description: cs.description },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const index = CASE_STUDIES.findIndex((c) => c.slug === slug);
  if (index === -1) notFound();
  const cs = CASE_STUDIES[index];
  const next = CASE_STUDIES[(index + 1) % CASE_STUDIES.length];
  const Body = cs.Body;

  return (
    <article className="container">
      <header className="cs-header">
        <p className="breadcrumb">
          <Link href="/#work">Selected work</Link>
        </p>
        <p className="kicker">{cs.kicker}</p>
        <h1>{cs.title}</h1>
        <p className="cs-deck">{cs.deck}</p>
        <ul className="cs-meta">
          {cs.meta.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <div className="link-row">
          {cs.links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      </header>

      <div className="cs-body">
        <Body />
        <nav className="cs-nav" aria-label="More work">
          <Link href="/#work">All work</Link>
          <Link href={`/work/${next.slug}`}>Next case study: {next.title}</Link>
        </nav>
      </div>
    </article>
  );
}
