// Link check over what actually ships: the prerendered HTML from `next build`.
// Run `npm run build` first, then `npm run check:links`.
//
// External links are fetched (GitHub blob links included, so a wrong path at a
// pinned commit shows up as a 404). In-page anchors (#work, /#contact) are
// checked against the ids present in the pages.

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, ".next", "server", "app");
if (!fs.existsSync(appDir)) {
  console.error("check-links: no build output. Run `npm run build` first.");
  process.exit(1);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const pages = walk(appDir);
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
const external = new Map(); // url -> first page seen
const ids = new Set();
const anchors = [];

for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);
  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = decode(m[1]);
    if (/^https?:\/\//.test(href)) {
      if (!external.has(href)) external.set(href, path.relative(appDir, file));
    } else if (href.includes("#")) {
      anchors.push({ href, page: path.relative(appDir, file) });
    }
  }
}

const problems = [];
for (const { href, page } of anchors) {
  const id = href.split("#")[1];
  if (id && !ids.has(id)) problems.push(`${page}: anchor ${href} has no matching id`);
}

// LinkedIn answers every script with 999, and the site's own canonical/OG URLs
// point at wherever the build thinks it will be served.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const SKIP = [/linkedin\.com/, /^https?:\/\/localhost(:\d+)?/, ...(SITE_URL ? [new RegExp(`^${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)] : [])];
const urls = [...external.keys()].filter((u) => !SKIP.some((re) => re.test(u)));

async function check(url) {
  const target = url.split("#")[0];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(target, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000) });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      return res.status;
    } catch (err) {
      if (attempt === 1) return `error: ${err.message}`;
    }
  }
  return "rate limited";
}

let i = 0;
const results = [];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (i < urls.length) {
      const url = urls[i++];
      results.push({ url, status: await check(url) });
    }
  }),
);

for (const { url, status } of results) {
  if (typeof status !== "number" || status >= 400) problems.push(`${external.get(url)}: ${status} ${url}`);
}

if (problems.length) {
  console.error(`check-links: ${problems.length} problem(s)\n` + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
console.log(`check-links: ok (${pages.length} pages, ${urls.length} external links, ${anchors.length} anchors)`);
