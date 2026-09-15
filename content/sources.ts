// Every figure on the site links to the committed file it came from, pinned to
// a full commit SHA so the link keeps pointing at the same bytes after the
// repository moves on. Update a SHA only after re-checking the numbers that
// cite it (scripts/check-content.mjs lists them).

export type SourceRef = { label: string; href: string };

const OWNER = "vineethkodakandla";

export const REPOS = {
  bitwise: {
    name: "bitwise-forensics",
    sha: "6aa651d45ec2a24bbd9080521999218c877a5e37",
    tag: "v0.3.1",
  },
  edge: {
    name: "edge-vision-lab",
    sha: "e5ecc43e37f98e473440881d372f572d624e04e4",
  },
  evals: {
    name: "llm-eval-observatory",
    sha: "bf8ad56b9899e24b72eba02a52c98a768f0854de",
  },
  edith: {
    name: "edith-lab",
    sha: "e2ff4709730fe5d07b26a6e5ba80043448b3b9d5",
  },
  ananta: {
    name: "ananta-lab",
    sha: "8bfb220bfafb501f5b0f8060bd5db754465b629c",
  },
  pathwise: {
    name: "pathwise-ai",
    sha: "37cec5519af251beb44bdd22d917375fd6c836e9",
  },
} as const;

export type RepoKey = keyof typeof REPOS;

export function repoUrl(key: RepoKey): string {
  return `https://github.com/${OWNER}/${REPOS[key].name}`;
}

export function shortSha(key: RepoKey): string {
  return REPOS[key].sha.slice(0, 7);
}

// GitHub renders Markdown, CSV and JSON Lines, which swallows line anchors;
// ?plain=1 shows the raw file so #L12-L20 lands on the right lines.
const RENDERED = /\.(md|csv|jsonl|json)$/i;

export function blob(key: RepoKey, path: string, lines?: [number, number?]): string {
  const r = REPOS[key];
  const plain = lines && RENDERED.test(path) ? "?plain=1" : "";
  const anchor = lines ? `#L${lines[0]}${lines[1] ? `-L${lines[1]}` : ""}` : "";
  return `https://github.com/${OWNER}/${r.name}/blob/${r.sha}/${path}${plain}${anchor}`;
}

export function src(key: RepoKey, path: string, lines?: [number, number?]): SourceRef {
  const base = path.split("/").pop() ?? path;
  const where = lines ? ` L${lines[0]}${lines[1] ? `-${lines[1]}` : ""}` : "";
  return { label: `${base}${where}`, href: blob(key, path, lines) };
}
