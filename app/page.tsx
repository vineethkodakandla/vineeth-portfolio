import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import EvalLiveStatus from "@/components/EvalLiveStatus";
import { Source } from "@/components/Source";
import { CERTIFICATIONS, EDUCATION, ROLES, SKILLS, type Entry } from "@/content/experience";
import { ALSO_BUILT, FEATURED, type LinkRef, type Project } from "@/content/projects";
import { SITE } from "@/content/site";
import { src } from "@/content/sources";

export const metadata: Metadata = { alternates: { canonical: "/" } };

function ProjectLink({ link }: { link: LinkRef }) {
  return link.href.startsWith("/") ? <Link href={link.href}>{link.label}</Link> : <a href={link.href}>{link.label}</a>;
}

function WorkCard({ project }: { project: Project }) {
  const titleId = `work-${project.slug}`;
  return (
    <article className="work-card" aria-labelledby={titleId}>
      <div>
        <p className="kicker">{project.kicker}</p>
        <h3 id={titleId}>
          {project.caseStudy ? <Link href={`/work/${project.slug}`}>{project.title}</Link> : project.title}
        </h3>
        {project.question ? <p className="question">{project.question}</p> : null}
        <p className="summary">{project.summary}</p>
        <ul className="chips" aria-label="Tools used">
          {project.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="link-row">
          {project.links.map((l) => (
            <ProjectLink key={l.href} link={l} />
          ))}
        </div>
      </div>
      <div className="figures">
        {project.live ? <EvalLiveStatus /> : null}
        {project.figures.map((f) => (
          <div className="figure-stat" key={f.value}>
            <div className="value">{f.value}</div>
            <div className="label">{f.label}</div>
            <Source source={f.source} />
          </div>
        ))}
      </div>
    </article>
  );
}

function AlsoItem({ project }: { project: Project }) {
  return (
    <article className="also-item" aria-labelledby={`also-${project.slug}`}>
      <p className="kicker">{project.kicker}</p>
      <h4 id={`also-${project.slug}`}>{project.title}</h4>
      <p>{project.summary}</p>
      <ul className="chips" aria-label="Tools used">
        {project.stack.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <div className="link-row">
        {project.links.map((l) => (
          <ProjectLink key={l.href} link={l} />
        ))}
      </div>
    </article>
  );
}

function TimelineItem({ entry }: { entry: Entry }) {
  return (
    <li>
      <div className="when">{entry.dates}</div>
      <div>
        <h3>{entry.org}</h3>
        <div className="where">{entry.place}</div>
        <p>{entry.summary}</p>
      </div>
    </li>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero container" aria-labelledby="hero-title">
        <p className="kicker">{SITE.name}, ML engineer</p>
        <h1 id="hero-title">Inference engineering, with the data attached.</h1>
        <p className="lede">
          I work on serving models: how fast and how cheaply they run on real hardware, and whether their output
          holds up. Before my M.S. in Computer Science, I worked on LLM serving at EXL and on real-time vision
          inference at L&amp;T Technology Services.
        </p>
        <p className="note">
          The projects below are public. Every measured result on this site links to the committed file it came
          from, and each write-up says what its measurement does not show.
        </p>
        <div className="actions">
          <a className="button primary" href="#work">
            See the work
          </a>
          <a className="button" href={`mailto:${SITE.email}`}>
            Email me
          </a>
          <a className="button" href={SITE.github}>
            GitHub
          </a>
        </div>
        <p className="availability">Open to ML engineer, inference and software engineering roles. Based in New Jersey.</p>
      </section>

      <section id="work" className="section" aria-labelledby="work-title">
        <div className="container">
          <div className="section-head">
            <h2 id="work-title">Selected work</h2>
            <p>Three measurement projects, each with a write-up of the setup, the findings and the limits.</p>
          </div>
          <div className="work-list">
            {FEATURED.map((p) => (
              <WorkCard key={p.slug} project={p} />
            ))}
          </div>

          <div className="also-block">
            <h3 className="subhead">Also built</h3>
            <div className="also">
              {ALSO_BUILT.map((p) => (
                <AlsoItem key={p.slug} project={p} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className="section" aria-labelledby="experience-title">
        <div className="container">
          <div className="section-head">
            <h2 id="experience-title">Experience</h2>
            <p>Work at these companies is not public, so it is described here without figures.</p>
          </div>
          <ol className="timeline">
            {ROLES.map((r) => (
              <TimelineItem key={r.org} entry={r} />
            ))}
            <TimelineItem entry={EDUCATION} />
          </ol>

          <div className="skills-block">
            <h3 className="subhead">Tools and methods</h3>
            <div className="skills">
              {SKILLS.map((g) => (
                <div key={g.group}>
                  <h4>{g.group}</h4>
                  <ul>
                    {g.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <h4>Certification</h4>
                <ul>
                  {CERTIFICATIONS.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section" aria-labelledby="about-title">
        <div className="container">
          <div className="section-head">
            <h2 id="about-title">About</h2>
          </div>
          <div className="prose">
            <p>
              Most of my projects start from a claim that is easy to repeat and then check where it holds: that a
              benchmark picks the right processor for a camera, that greedy decoding gives the same tokens when
              requests are batched together, that a model can triage alerts without a person reading each one. The
              answer is usually that it depends, and the useful part is finding out on what.
            </p>
            <p>
              I also try to publish what a result does not show, and to drop results that fail a check.
              bitwise-forensics began as a simulator. When a check across 12 random seeds showed that the
              simulated load trend changed with the seed, I kept the simulator only as a pipeline test and measured
              a real engine instead.
            </p>
            <p>
              <Source prefix="Seed check" source={src("bitwise", "analysis/output/sim_seeds.md")} />
            </p>
            <p>
              I like small, inspectable builds as well, like the two browser demos above, and the assistant on this
              site, which answers questions about my work from the same material you are reading.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="section" aria-labelledby="contact-title">
        <div className="container contact-grid">
          <div>
            <h2 id="contact-title" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)" }}>
              Contact
            </h2>
            <ul className="contact-lines">
              <li>
                <span className="label">Email</span> <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
              <li>
                <span className="label">LinkedIn</span> <a href={SITE.linkedin}>in/vineethkodakandla</a>
              </li>
              <li>
                <span className="label">GitHub</span> <a href={SITE.github}>vineethkodakandla</a>
              </li>
              <li>
                <span className="label">Resume</span>{" "}
                <a href={`mailto:${SITE.email}?subject=${encodeURIComponent("Resume request")}`}>On request by email</a>
              </li>
            </ul>
            <div className="note-box">
              <p>
                <strong>Work authorization.</strong> I am on F-1 OPT and authorized to work in the US now. I will
                need H-1B sponsorship to continue beyond OPT, and I would rather talk about that early. Roles that
                require US citizenship or a security clearance are not a fit.
              </p>
            </div>
          </div>
          <div>
            <h3 className="subhead">Send a message</h3>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
