import Link from "next/link";
import SectionLink from "@/components/SectionLink";
import ThemeToggle from "@/components/ThemeToggle";
import { NAV } from "@/content/site";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand">
          Vineeth <span className="brand-middle">Reddy </span>Kodakandla
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {NAV.map((item) => (
            <SectionLink
              key={item.href}
              href={item.href}
              className={item.label === "Experience" || item.label === "About" ? "nav-optional" : undefined}
            >
              {item.label}
            </SectionLink>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
