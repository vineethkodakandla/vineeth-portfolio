// Employment and education. This is a public, archivable page, so it carries a
// strict subset of the resume: company, place, years and what the work was.
// No job titles, seniority verbs, team scope, internal figures or exact months.
// Internal numbers cannot link to a public file, so they stay off this site.
// Before adding anything here, check it against
// RESUME_APPLY/SILICON/INFERENCE_ENGINEER/SOURCE_Work_Experience_2022-2024.v2.md
// and its DO NOT SAY list.

export type Entry = {
  org: string;
  place: string;
  dates: string;
  summary: string;
};

export const ROLES: Entry[] = [
  {
    org: "EXL",
    place: "Noida, India",
    dates: "2023 to 2024",
    summary:
      "LLM serving for insurance underwriting and claims work. I worked on the Amazon Bedrock serving path (prompt routing, context-window management and token streaming), on evaluation runs that compared fine-tuned models with commercial models, and on the latency and cost dashboards the team used. I contributed pre-launch engineering to LDS Underwriting Assist, which EXL launched in August 2024.",
  },
  {
    org: "L&T Technology Services",
    place: "Bengaluru, India",
    dates: "2022 to 2023",
    summary:
      "Real-time inference for endoscopy video, covering image enhancement and polyp detection, on NVIDIA's Holoscan SDK and developer kits. I moved models from PyTorch to ONNX Runtime and TensorRT, enabling FP16 where supported, restructured the input pipeline to cut per-frame latency, and wrote the benchmarking scripts used to compare edge targets. I started there as an intern.",
  },
];

export const EDUCATION: Entry = {
  org: "Texas A&M University-Corpus Christi",
  place: "M.S. in Computer Science",
  dates: "Aug 2024 to May 2026",
  summary:
    "Graduate research assistant on rule-based multi-agent access control (ABAC and XACML), and teaching assistant for Computer Forensics. Coursework included computer architecture, advanced software engineering, network security and agent-based systems.",
};

export const CERTIFICATIONS = ["Building with the Claude API (Anthropic)"];

export const SKILLS: { group: string; items: string[] }[] = [
  {
    group: "Inference and optimization",
    items: [
      "OpenVINO and OpenVINO GenAI",
      "NNCF post-training quantization",
      "ONNX Runtime and TensorRT",
      "FP16 and INT8 quantization",
      "Continuous batching",
    ],
  },
  {
    group: "Measurement",
    items: [
      "Latency distributions and frame budgets",
      "Bootstrap confidence intervals",
      "Paired comparisons",
      "Replay and reproducibility checks",
      "Benchmark automation",
    ],
  },
  {
    group: "LLM applications and evaluation",
    items: [
      "Evaluation harnesses",
      "Prompt-injection testing",
      "LLM-as-judge reliability",
      "Retrieval-augmented generation",
      "Amazon Bedrock",
    ],
  },
  {
    group: "Engineering",
    items: [
      "Python, TypeScript, C++, SQL",
      "NumPy, pandas, PyTorch",
      "FastAPI, React, Next.js",
      "PostgreSQL and pgvector",
      "Docker, Kubernetes, GitHub Actions",
    ],
  },
];
