import AgentGraph from "@/components/AgentGraph";
import Chatbot from "@/components/Chatbot";
import Reveal from "@/components/Motion";
import ContactForm from "@/components/ContactForm";
import ViewCount from "@/components/ViewCount";
import ThemeToggle from "@/components/ThemeToggle";

// EDIT: your real links.
const LINKS = {
  email: "mailto:vineethkodakandla@gmail.com",
  github: "https://github.com/vineethkodakandla",
  linkedin: "https://www.linkedin.com/in/vineethkodakandla",
  resume: "/resume.pdf", // drop resume.pdf into /public
};

export default function Home() {
  return (
    <>
      {/* STATUS BAR */}
      <div className="statusbar">
        <div className="wrap row">
          <span className="dot" />
          <span className="name">VINEETH REDDY KODAKANDLA</span>
          <span>AI/ML ENGINEER</span>
          <span className="statthey">
            <a href={LINKS.github} target="_blank" rel="noopener">GITHUB</a>
            <a href={LINKS.linkedin} target="_blank" rel="noopener">LINKEDIN</a>
            <a href={LINKS.email}>EMAIL</a>
            <ThemeToggle />
          </span>
        </div>
      </div>

      {/* HERO */}
      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="h-availability">
              <span className="dot" />
              <span className="mono">Open to work · AI/ML · Forward Deployed · NY/NJ + Remote</span>
            </div>
            <h1>AI that works<br /><span className="accent">after</span> the demo.</h1>
            <p className="lede">
              I build <strong>multi-agent platforms, RAG pipelines, and the MLOps plumbing</strong> that keeps them reliable once real users show up. MS in Computer Science. Targeting AI/ML, Applied AI, and Forward Deployed roles.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#work">View selected work →</a>
              <a className="btn btn-ghost" href="#contact">Get in touch</a>
            </div>
          </div>
          <div className="graph-card">
            <AgentGraph />
            <div className="graph-corner"><i className="on" /><i /><i className="on" /></div>
            <div className="graph-tag"><b>edith</b> — multi-agent orchestration · live</div>
          </div>
        </div>
      </header>

      {/* TELEMETRY */}
      <div className="telemetry">
        <div className="wrap tel-grid">
          <div className="tel"><div className="k">Education</div><div className="v">MS Computer Science<br /><span>Texas A&amp;M–Corpus Christi · 2026</span></div></div>
          <div className="tel"><div className="k">Focus</div><div className="v">Agentic systems<br /><span>RAG · MLOps · production AI</span></div></div>
          <div className="tel"><div className="k">Core stack</div><div className="v">Python · TypeScript<br /><span>LangGraph · K8s · AWS</span></div></div>
          <div className="tel"><div className="k">Based</div><div className="v">NYC metro area<br /><span>Open to remote</span></div></div>
        </div>
      </div>

      {/* WORK */}
      <section className="block" id="work">
        <div className="wrap">
          <Reveal><div className="sec-head"><span className="num">01</span><h2>Selected work</h2><span className="rule" /></div></Reveal>

          <Reveal>
            <article className="proj">
              <div className="proj-top">
                <div>
                  <div className="domain">Multi-agent systems · LLMs</div>
                  <h3>Edith</h3>
                  <div className="tagline">Agents that actually remember.</div>
                  <ViewCount projectId="edith" />
                </div>
                <span className="badge">Flagship</span>
              </div>
              <p>Single-agent LLM setups forget everything between sessions and drift off task. Edith is a <strong>multi-agent platform with long-term memory consolidation and RAG</strong>, containerized for deployment — agents retain and reuse context across sessions instead of being impressive once and useless twice. The hard part wasn&apos;t the model; it was the memory layer and keeping a team of agents coordinated and reliable.</p>
              <span className="metric"><b>impact:</b> [ add metric — retrieval accuracy, task success rate, or latency ]</span>
              <div className="stack">
                <span className="chip">Python</span><span className="chip">LangGraph</span><span className="chip">CrewAI</span>
                <span className="chip">RAG</span><span className="chip">Mem0</span><span className="chip">Docker</span><span className="chip">Kubernetes</span>
              </div>
            </article>
          </Reveal>

          <Reveal>
            <article className="proj alert">
              <div className="proj-top">
                <div>
                  <div className="domain">Network AIOps · Forward Deployed</div>
                  <h3>PathwiseAI</h3>
                  <div className="tagline">Catch the outage before it happens.</div>
                  <ViewCount projectId="pathwise" />
                </div>
                <span className="badge flag">Most FDE-aligned</span>
              </div>
              <p>Network operators react to SLA violations after they hit and write policy in raw NETCONF. PathwiseAI <strong>predicts SLA violations early with an LSTM model</strong>, lets operators write policy in plain English, and runs every change through a <strong>digital-twin layer that validates it before it touches the live network</strong> — behind a React/TypeScript operator dashboard. Benchmarked against Cisco, VMware, and Fortinet. Built around a real operator&apos;s workflow, not just a model.</p>
              <span className="metric"><b>impact:</b> [ add metric — % of violations flagged early, or config-time reduction ]</span>
              <div className="stack">
                <span className="chip">Python</span><span className="chip">LSTM</span><span className="chip">React</span>
                <span className="chip">TypeScript</span><span className="chip">NETCONF</span><span className="chip">Digital twin</span>
              </div>
            </article>
          </Reveal>

          <Reveal>
            <div className="proj-secondary">
              <article className="proj">
                <div className="proj-top"><div><div className="domain">Full-stack · CI/CD</div><h3>Pathfinders</h3><ViewCount projectId="pathfinders" /></div></div>
                <p>CI/CD analytics platform: <strong>FastAPI</strong> backend, <strong>React</strong> frontend, Redis and TimescaleDB for time-series pipeline data, automated through GitHub Actions.</p>
                <div className="stack"><span className="chip">FastAPI</span><span className="chip">React</span><span className="chip">Redis</span><span className="chip">TimescaleDB</span><span className="chip">GitHub Actions</span></div>
              </article>
              <article className="proj">
                <div className="proj-top"><div><div className="domain">Research · Access control</div><h3>Rule-Based Multi-Agent Access</h3></div></div>
                <p>Graduate research on an <strong>ABAC/XACML multi-agent system</strong> — a deterministic, rule-based counterpart to LLM agents for cooperative access-control decisions.</p>
                <div className="stack"><span className="chip">ABAC</span><span className="chip">XACML</span><span className="chip">Multi-agent</span><span className="chip">Policy</span></div>
              </article>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="block">
        <div className="wrap">
          <Reveal><div className="sec-head"><span className="num">02</span><h2>Capabilities</h2><span className="rule" /></div></Reveal>
          <Reveal>
            <div className="caps">
              <div className="cap"><h4>Agents &amp; LLMs</h4><ul><li>LangGraph</li><li>CrewAI</li><li>RAG</li><li>Mem0</li><li>LoRA / QLoRA</li><li>Eval &amp; prompting</li></ul></div>
              <div className="cap"><h4>MLOps &amp; Infra</h4><ul><li>Docker</li><li>Kubernetes</li><li>AWS</li><li>FastAPI</li><li>GitHub Actions</li></ul></div>
              <div className="cap"><h4>Languages &amp; Data</h4><ul><li>Python</li><li>TypeScript</li><li>SQL</li><li>React</li><li>PostgreSQL</li><li>TimescaleDB · Redis</li></ul></div>
              <div className="cap now"><h4>Currently</h4><ul><li>AWS Machine Learning – Specialty (in progress)</li></ul></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ABOUT */}
      <section className="block about">
        <div className="wrap">
          <Reveal><div className="sec-head"><span className="num">03</span><h2>About</h2><span className="rule" /></div></Reveal>
          <Reveal>
            <p>I build AI systems that make it out of the notebook and into production. Most of my work centers on <strong>agentic systems</strong> — giving LLMs memory, tools, and enough structure to act dependably instead of just impressively in a demo.</p>
            <p>My research background is in <strong>rule-based, deterministic multi-agent systems</strong>, which gives me a useful instinct for where probabilistic LLM agents need guardrails — when to trust the model and when to constrain it. I care most about the seam where a model meets a real user and has to keep working.</p>
            <p className="sig">// MS Computer Science, Texas A&amp;M–Corpus Christi · open to AI/ML, Applied AI &amp; Forward Deployed Engineer roles</p>
          </Reveal>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">// let&apos;s build something that ships</span>
            <h2>Get in touch.</h2>
            <p>If you&apos;re building something where models have to work in front of real users, I&apos;d like to talk.</p>
            <ContactForm />
            <div className="cta-row">
              <a className="btn btn-primary" href={LINKS.email}>Email me →</a>
              <a className="btn btn-ghost" href={LINKS.linkedin} target="_blank" rel="noopener">LinkedIn</a>
              <a className="btn btn-ghost" href={LINKS.github} target="_blank" rel="noopener">GitHub</a>
              <a className="btn btn-ghost" href={LINKS.resume} target="_blank" rel="noopener">Résumé (PDF)</a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer>
        <div className="wrap row">
          <span>© 2026 Vineeth Reddy Kodakandla</span>
          <span>Next.js · RAG chatbot · powered by Claude</span>
        </div>
      </footer>

      <Chatbot />
    </>
  );
}
