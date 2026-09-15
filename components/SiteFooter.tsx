import { SITE } from "@/content/site";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          Measured results on this site link to the committed files they come from. Content last checked against
          the source repositories on {SITE.reviewed}.
        </p>
        <nav aria-label="Elsewhere">
          <a href={`mailto:${SITE.email}`}>Email</a>
          <a href={SITE.linkedin}>LinkedIn</a>
          <a href={SITE.github}>GitHub</a>
          <a href={SITE.source}>Site source</a>
        </nav>
      </div>
    </footer>
  );
}
