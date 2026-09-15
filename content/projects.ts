import { repoUrl, src, type SourceRef } from "./sources";
import { SITE } from "./site";

// Project cards. Every figure carries the committed file it came from, and the
// wording was checked against each repository on 15 Sep 2026 (claims the code
// does not back were removed). The chatbot's knowledge base (data/knowledge.json)
// must describe the same projects with the same numbers; scripts/check-content.mjs
// fails when a slug here has no matching chunk there.

export type Figure = { value: string; label: string; source: SourceRef[] };
export type LinkRef = { label: string; href: string };

export type Project = {
  slug: string;
  title: string;
  kicker: string;
  question?: string;
  summary: string;
  figures: Figure[];
  links: LinkRef[];
  stack: string[];
  caseStudy?: boolean;
  /** Renders the live nightly-run status from llm-eval-observatory. */
  live?: boolean;
};

export const FEATURED: Project[] = [
  {
    slug: "bitwise-forensics",
    title: "bitwise-forensics",
    kicker: "LLM serving / reproducibility",
    question:
      "Does a serving engine return the same greedy tokens for a prompt when other requests share its engine steps?",
    summary:
      "I measured OpenVINO GenAI's continuous-batching pipeline serving Qwen2.5-Coder-0.5B (INT4 weights) on the CPU and Arc iGPU of an Intel Core Ultra 7 155H: 40 prompts, 8 trials, 7,680 runs. Under each device's default settings, most batched runs produced different tokens from the same prompt served alone. Replaying an arrival schedule reproduced every run, and on the CPU the main lever was dynamic activation quantization.",
    figures: [
      {
        value: "320 of 320",
        label:
          "runs at arrival rate c8 reproduced bit for bit when their arrival schedules were replayed, on each device",
        source: [
          src("bitwise", "analysis/output/readme_stats.json", [802, 808]),
          src("bitwise", "analysis/output/readme_stats.json", [943, 949]),
        ],
      },
      {
        value: "71.2% to 21.2%",
        label:
          "CPU runs at c8 whose tokens changed, before and after turning off dynamic quantization (paired 95% CI for the drop: 34.7 to 64.4 points)",
        source: [src("bitwise", "results/openvino/cpu/paired.csv", [3])],
      },
    ],
    links: [
      { label: "Read the case study", href: "/work/bitwise-forensics" },
      { label: "Repository (v0.3.0)", href: `${repoUrl("bitwise")}/tree/v0.3.0` },
    ],
    stack: ["Python", "OpenVINO GenAI", "Continuous batching", "Bootstrap statistics", "pytest", "GitHub Actions"],
    caseStudy: true,
  },
  {
    slug: "meteor-lake-latency-lab",
    title: "Meteor Lake Latency Lab",
    kicker: "Edge inference / latency",
    question:
      "Which processor on one laptop chip should run live instance segmentation inside a 33.3 ms frame budget: the NPU, the Arc iGPU or the CPU?",
    summary:
      "YOLOv8n-seg through OpenVINO on an Intel Core Ultra 7 155H, across three processors and FP32, FP16 and two INT8 builds, with 1,000 timed frames per configuration. A flat-out benchmark and a live webcam loop ranked the processors differently. On the flat-out iGPU frames that missed the budget, CPU-side postprocessing had stalled while inference itself stayed fast.",
    figures: [
      {
        value: "47.0 ms to 13.3 ms",
        label: "p99 latency of INT8 on the Arc iGPU, flat-out benchmark against a live webcam loop",
        source: [src("edge", "results/live_results.json", [30, 51])],
      },
      {
        value: "0.0015 vs 0.0389",
        label:
          "box mAP lost when INT8 keeps the detection-head decode in float, against quantizing all of it",
        source: [src("edge", "results/accuracy.json", [24, 45])],
      },
    ],
    links: [
      { label: "Read the case study", href: "/work/meteor-lake-latency-lab" },
      { label: "Repository", href: repoUrl("edge") },
    ],
    stack: ["Python", "OpenVINO", "NNCF INT8", "NumPy", "pandas"],
    caseStudy: true,
  },
  {
    slug: "llm-eval-observatory",
    title: "LLM Eval Observatory",
    kicker: "LLM evaluation / automation",
    question:
      "Can an open-weight model triage anti-money-laundering alerts without a person checking every case, and can its scores be trusted?",
    summary:
      "A GitHub Action runs nightly against open-weight models on Groq and commits the results for a dashboard on Vercel. The main track gives each model 26 hand-written synthetic AML cases, scored by a fixed parser rather than another model; the number that matters is the false clear. Three more tracks cover prompt injection, capability drift and LLM-as-judge reliability, all with bootstrap intervals.",
    figures: [],
    live: true,
    links: [
      { label: "Read the case study", href: "/work/llm-eval-observatory" },
      { label: "Dashboard", href: "https://llm-eval-observatory.vercel.app" },
      { label: "Repository", href: repoUrl("evals") },
    ],
    stack: ["Python", "GitHub Actions", "Bootstrap statistics", "Next.js", "Groq API"],
    caseStudy: true,
  },
];

export const ALSO_BUILT: Project[] = [
  {
    slug: "edith",
    title: "Edith",
    kicker: "Multi-agent pipeline / browser demo",
    summary:
      "Researcher, Analyst, Critic and Synthesizer agents run in a fixed order over a shared blackboard. The Critic can send a draft back once, and a rule-based Governor withholds any recommendation with no retrieved source behind it and marks it for human review. Deterministic by default over an 8-document corpus; with a Groq key the four agents make real Llama calls while the gate stays rule-based.",
    figures: [],
    links: [
      { label: "Live demo", href: "https://vineethkodakandla.github.io/edith-lab/" },
      { label: "Repository", href: repoUrl("edith") },
    ],
    stack: ["JavaScript", "Groq API", "Rule-based policy gate"],
  },
  {
    slug: "ananta",
    title: "ANANTA",
    kicker: "Agent memory / browser demo",
    summary:
      "An agent memory that forgets on purpose. Each memory decays on an Ebbinghaus curve, each recall raises its stability, a decay pass prunes what has faded, and every write is SHA-256 chained, so an edited memory fails verification. A deterministic agent loop sits on top: lexical retrieval over 8 documents, keyword-scored routing, and abstaining when retrieval is thin.",
    figures: [],
    links: [
      { label: "Live demo", href: "https://vineethkodakandla.github.io/ananta-lab/" },
      { label: "Repository", href: repoUrl("ananta") },
    ],
    stack: ["JavaScript", "Web Crypto", "Groq API"],
  },
  {
    slug: "site",
    title: "This site",
    kicker: "Retrieval-augmented chatbot",
    summary:
      "Next.js on Vercel with a chatbot that answers questions about my work. A question is embedded with Voyage, matched against a pgvector index in Postgres, and answered by Claude from the retrieved passages, which are listed under each answer.",
    figures: [],
    links: [{ label: "Source", href: SITE.source }],
    stack: ["Next.js", "TypeScript", "pgvector", "Claude API"],
  },
];

export const CASE_STUDY_SLUGS = FEATURED.filter((p) => p.caseStudy).map((p) => p.slug);
