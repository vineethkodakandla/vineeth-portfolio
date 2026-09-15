// Content gate. Run with `npm run check` before pushing.
//
// Fails on:
//  1. Wording the site has ruled out: em and en dashes, stock AI phrasing, and
//     the claims the source projects list as not supported by their data.
//     Checked per line and again over the file with JSX and line breaks
//     collapsed, so a phrase wrapped across lines or split by a tag is caught.
//  2. Seniority verbs or job titles in the employment content (see the note at
//     the top of content/experience.ts for why).
//  3. A project on the page with no chunk in data/knowledge.json, or a mismatch
//     between the knowledge chunks and the chatbot's SOURCE_LINKS keys.
//  4. Source links that are not pinned to a full commit SHA.

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const fail = (file, msg) => failures.push(`${path.relative(root, file)}: ${msg}`);

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "api" || entry.name === "node_modules") continue;
      walk(p, exts, out);
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      out.push(p);
    }
  }
  return out;
}

const files = [
  ...walk(path.join(root, "content"), [".ts", ".tsx"]),
  ...walk(path.join(root, "components"), [".tsx", ".ts"]),
  ...walk(path.join(root, "app"), [".tsx", ".ts"]),
  path.join(root, "data", "knowledge.json"),
  path.join(root, "app", "api", "chat", "route.ts"),
];

const BANNED = [
  { re: /—/, why: "em dash" },
  { re: /–/, why: "en dash (write 'to' for ranges)" },
  {
    re: /\b(delve|leverag(e|es|ing)|seamless(ly)?|cutting-edge|passionate|spearhead(ed|ing)?|synerg(y|ies)|game[- ]chang(er|ing)|world-class|revolutioni[sz]e|supercharge|unlock(s|ing)?|empower(s|ing)?|robust)\b/i,
    why: "stock phrasing",
  },
  // bitwise-forensics: claims its data does not support.
  { re: /\bnon-?deterministic\b/i, why: "bitwise: do not call inference nondeterministic" },
  { re: /(?<!not )(?<!not\s)\bbatch[- ]invariant\b/i, why: "bitwise: no setting was shown to be batch-invariant" },
  { re: /\bc32\b[^.]{0,40}\busers?\b/i, why: "bitwise: c32 is an arrival rate, not users" },
  { re: /\b(vLLM|Thinking Machines)\b/, why: "bitwise: no comparison with vLLM or Thinking Machines" },
  // Meteor Lake: numbers that exist only in prose, or were wrong.
  { re: /371\s*\/\s*371|371 of 371/, why: "edge: the postprocess check output is not committed" },
  { re: /\b5\.5\s*(x|×|times)/i, why: "edge: the outlier ratio in the data is 5.4x" },
  { re: /wins outright/i, why: "edge: the iGPU missed the budget more often than the NPU" },
];

const EMPLOYMENT_FILES = new Set([
  path.join(root, "content", "experience.ts"),
  path.join(root, "data", "knowledge.json"),
]);
const EMPLOYMENT_BANNED = [
  { re: /\b(led|architected|spearheaded|headed|managed a team)\b/i, why: "seniority verb in employment content" },
  { re: /\b(ML|Machine Learning|Inference|Senior|Lead)\s+Engineer,?\s+(at\s+)?(EXL|L&T|LTTS)/i, why: "job title claim" },
  { re: /\b(IGX Orin|NeMo|NIM|Holopack|sub-100 ?ms|SLA|clinical sites|delivery cent(er|re)s)\b/, why: "claim flagged in the v2 fact check" },
];

// Collapse JSX spacing expressions, tags and whitespace so wrapped prose reads as
// one line of text.
const flatten = (text) =>
  text
    .replace(/\{"\s*"\}/g, " ")
    .replace(/<[^<>]*>/g, " ")
    .replace(/\s+/g, " ");

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const reported = new Set();

  lines.forEach((line, i) => {
    for (const { re, why } of BANNED) {
      if (re.test(line)) {
        fail(file, `line ${i + 1}: ${why}`);
        reported.add(why);
      }
    }
    if (EMPLOYMENT_FILES.has(file)) {
      for (const { re, why } of EMPLOYMENT_BANNED) {
        // In knowledge.json only the employment chunks carry employment claims.
        if (file.endsWith("knowledge.json") && !/experience-(exl|ltts)|"intro"/.test(lines.slice(Math.max(0, i - 3), i + 1).join("\n"))) continue;
        if (re.test(line)) fail(file, `line ${i + 1}: ${why}`);
      }
    }
  });

  const flat = flatten(text);
  for (const { re, why } of BANNED) {
    if (!reported.has(why) && re.test(flat)) fail(file, `${why} (the phrase spans lines or a tag)`);
  }
}

// 3. Projects, knowledge chunks and chatbot source links agree.
const projectsSrc = fs.readFileSync(path.join(root, "content", "projects.ts"), "utf8");
const slugs = [...projectsSrc.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const SLUG_TO_CHUNK = {
  "bitwise-forensics": "bitwise",
  "meteor-lake-latency-lab": "edge-vision",
  "llm-eval-observatory": "eval-observatory",
  "pathwise-ai": "pathwise",
};
const kbFile = path.join(root, "data", "knowledge.json");
const kb = JSON.parse(fs.readFileSync(kbFile, "utf8"));
const chunkIds = kb.chunks.map((c) => c.id);
const chunkSet = new Set(chunkIds);
if (chunkSet.size !== chunkIds.length) fail(kbFile, "duplicate chunk ids");
for (const slug of slugs) {
  const id = SLUG_TO_CHUNK[slug] ?? slug;
  if (!chunkSet.has(id)) fail(kbFile, `no chunk "${id}" for project "${slug}"`);
}

const chatbotFile = path.join(root, "components", "Chatbot.tsx");
const chatbotSrc = fs.readFileSync(chatbotFile, "utf8");
const linksBlock = chatbotSrc.match(/const SOURCE_LINKS[^=]*=\s*\{([\s\S]*?)\};/);
if (!linksBlock) {
  fail(chatbotFile, "SOURCE_LINKS object not found");
} else {
  const keys = new Set([...linksBlock[1].matchAll(/["']?([A-Za-z0-9_-]+)["']?\s*:\s*["']/g)].map((m) => m[1]));
  for (const id of chunkSet) if (!keys.has(id)) fail(chatbotFile, `SOURCE_LINKS has no entry for chunk "${id}"`);
  for (const key of keys) if (!chunkSet.has(key)) fail(chatbotFile, `SOURCE_LINKS has "${key}", which is not a chunk id`);
}

// 4. Pinned sources.
const sourcesFile = path.join(root, "content", "sources.ts");
const sourcesSrc = fs.readFileSync(sourcesFile, "utf8");
for (const m of sourcesSrc.matchAll(/sha:\s*"([^"]*)"/g)) {
  if (!/^[0-9a-f]{40}$/.test(m[1])) fail(sourcesFile, `sha "${m[1]}" is not a full 40-character commit SHA`);
}
for (const file of walk(path.join(root, "content"), [".ts", ".tsx"])) {
  const text = fs.readFileSync(file, "utf8");
  if (/github\.com\/vineethkodakandla\/[^/"]+\/blob\/(main|master)\//.test(text)) {
    fail(file, "a blob link points at a moving branch; use src() so it is pinned to a commit");
  }
}

if (failures.length) {
  console.error(`check-content: ${failures.length} problem(s)\n` + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`check-content: ok (${files.length} files, ${slugs.length} projects, ${chunkSet.size} knowledge chunks)`);
