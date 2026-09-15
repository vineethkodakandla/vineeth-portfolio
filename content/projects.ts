import { repoUrl, src, type SourceRef } from "./sources";
import { SITE } from "./site";

// Project cards. Every figure carries the committed file it came from, and the
// wording was checked against each repository on 15 Sep 2026 (claims the code
// does not back were removed). The chatbot's knowledge base (data/knowledge.json)
// must describe the same projects with the same numbers; scripts/check-content.mjs
// fails when a slug here has no matching chunk there.
//
// PathWise AI is deliberately absent: its linked repository still carries README
// claims the code does not back, and its public demo needs locking down first.

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
      "I measured OpenVINO GenAI's continuous-batching pipeline serving Qwen2.5-Coder-0.5B (INT4 weights) on the CPU and Arc iGPU of an Intel Core Ultra 7 155H: 40 prompts, 8 trials, 7,680 runs. Under each device's default settings, most batched runs produced different tokens from the same prompt served alone. Where tested, the output was a fixed function of the arrival schedule: replaying the eight c8 schedules reproduced all 320 runs on each device. On the CPU the main lever was dynamic activation quantization.",
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
        source: [
          src("bitwise", "results/openvino/cpu/summary.csv", [7, 8]),
          src("bitwise", "results/openvino/cpu/paired.csv", [3]),
        ],
      },
    ],
    links: [
      { label: "Read the case study", href: "/work/bitwise-forensics" },
      { label: "Repository (v0.3.1)", href: `${repoUrl("bitwise")}/tree/v0.3.1` },
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
      "YOLOv8n-seg through OpenVINO on an Intel Core Ultra 7 155H, across three processors and FP32, FP16 and two INT8 builds, with 1,000 timed frames per configuration. For INT8 on the iGPU and the NPU, a flat-out benchmark and a live webcam loop reversed the p99 order, although the NPU missed the 33.3 ms budget less often in both; the CPU was not run live. The iGPU's flat-out tail came from frames where its CPU-side stages stalled, not from inference.",
    figures: [
      {
        value: "47.0 ms to 13.3 ms",
        label: "p99 latency of INT8 on the Arc iGPU, flat-out benchmark against a live webcam loop",
        source: [src("edge", "results/live_results.json", [30, 51])],
      },
      {
        value: "0.0015 vs 0.0389",
        label:
          "box mAP lost on the CPU when INT8 keeps the detection-head decode in float, against quantizing all of it",
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
      "A GitHub Action runs nightly against open-weight models on Groq and commits the results for a dashboard on Vercel. The main track gives each model 26 hand-written synthetic AML cases, scored by a fixed parser rather than another model; the number that matters is the false clear. Three more tracks cover prompt injection, capability drift and LLM-as-judge reliability, and each track's headline score carries a bootstrap interval.",
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
      "Researcher, Analyst, Critic and Synthesizer agents run in a fixed order over a shared blackboard, deterministically over an 8-document corpus. The Critic returns REVISE when retrieval found nothing, and a REVISE verdict makes the Synthesizer rewrite its draft once. A rule-based Governor then labels the recommendation blocked, for human review, when retrieval found no document sharing a keyword with the goal; it does not compare the text with the sources.",
    figures: [],
    links: [
      { label: "Live demo", href: "https://vineethkodakandla.github.io/edith-lab/" },
      { label: "Repository", href: repoUrl("edith") },
    ],
    stack: ["JavaScript", "Multi-agent orchestration", "Rule-based policy gate"],
  },
  {
    slug: "ananta",
    title: "ANANTA",
    kicker: "Agent memory / browser demo",
    summary:
      "An agent memory that forgets on purpose. Each memory decays on an Ebbinghaus curve, each recall raises its stability, a manual decay pass prunes faded memories below an importance cutoff, and every write chains a SHA-256 hash of the memory's text, timestamp and importance, so editing any of those fails verification. A deterministic agent loop sits on top: lexical retrieval over 8 documents, keyword-scored routing, and a self-check that escalates a tier when retrieval is thin (top score below 0.15) and no stored memory answers, abstaining only when nothing matches.",
    figures: [],
    links: [
      { label: "Live demo", href: "https://vineethkodakandla.github.io/ananta-lab/" },
      { label: "Repository", href: repoUrl("ananta") },
    ],
    stack: ["JavaScript", "Web Crypto", "Forgetting-curve decay"],
  },
  {
    slug: "site",
    title: "This site",
    kicker: "Retrieval-augmented chatbot",
    summary:
      "Next.js on Vercel with a chatbot that answers questions about my work from a short knowledge base written to match these pages. A question is embedded with Voyage, matched against a pgvector index in Postgres, and answered by Claude from the retrieved passages, which are listed under the answer when retrieval succeeds.",
    figures: [],
    links: [{ label: "Source", href: SITE.source }],
    stack: ["Next.js", "TypeScript", "pgvector", "Claude API"],
  },
];

export const CASE_STUDY_SLUGS = FEATURED.filter((p) => p.caseStudy).map((p) => p.slug);
