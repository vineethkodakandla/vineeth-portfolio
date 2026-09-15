# Vineeth Reddy Kodakandla: portfolio

Next.js 16 site for an ML engineer's public work, with a retrieval-augmented assistant.

The content follows one rule: every measured result links to the committed file it came from, pinned to a
commit SHA, and every write-up states what its measurement does not show. Scripts in `scripts/` enforce what
can be enforced mechanically.

```
app/
  page.tsx                 home: hero, selected work, experience, about, contact
  work/[slug]/page.tsx     case studies, statically generated from content/case-studies
  api/chat                 assistant: Voyage embeddings, pgvector retrieval, Claude
  api/contact              validated, rate-limited contact form (Postgres + Resend)
  api/track, counts,       page-view analytics and ops endpoints (metrics is token-guarded)
      health, metrics
  opengraph-image, twitter-image, sitemap, robots
components/
  charts/RowChart.tsx      HTML/CSS row charts: dumbbells, dot-and-interval rows, bars with whiskers
  charts/ChartFigure.tsx   figure wrapper: caption, table view of the same data, source line
  ChartTooltips.tsx        one tooltip for every chart; renders text only
  EvalLiveStatus.tsx       live panel over llm-eval-observatory's results (hourly ISR)
  Chatbot, ContactForm, CommandPalette (Ctrl/Cmd+K), SiteHeader, SiteFooter, Theme*
content/
  site.ts                  identity and navigation
  sources.ts               pinned repositories and the src()/blob() link helpers
  projects.ts              project cards
  experience.ts            employment and education (read the note at the top before editing)
  case-studies/*.tsx       case-study bodies, with their chart data inline
data/knowledge.json        the assistant's knowledge base; must describe the same things as the pages
lib/                       db, rag, ratelimit, validation, eval-live, analytics, email
scripts/                   migrate, embed, check-content, check-links
```

## Run locally

```bash
npm ci
npm run dev
```

The site builds and runs with no environment variables. The assistant renders only when `ANTHROPIC_API_KEY`
is set; see `.env.example` for everything else and what happens when each value is missing.

## Before pushing

```bash
npm run typecheck
npm run check          # wording rules, knowledge-base coverage, pinned sources
npm run build
npm run check:links    # fetches every external link in the prerendered pages
```

## Content rules

- **Numbers.** Cite with `src(repoKey, path, [startLine, endLine])` from `content/sources.ts`, which pins the
  link to the repository's commit. Change a SHA there only after re-checking every number that cites it.
- **Employment.** `content/experience.ts` is a strict subset of the resume: company, place, dates and a
  qualitative description. No titles, seniority verbs or internal figures. `npm run check` rejects the phrases
  the fact-checked record rules out.
- **Knowledge base.** Update `data/knowledge.json` in the same change as the page, then run `npm run embed`.
  Production answers from the `kb_chunks` table, not the JSON file, and `embed` both upserts the chunks and
  deletes rows whose ids are no longer in the file. A chunk id must have an entry in `SOURCE_LINKS` in
  `components/Chatbot.tsx`.
- **Charts.** Series colours are slots 1 to 3 of a validated palette (checked for colour-vision deficiency and
  contrast against both theme surfaces). Every chart ships its numbers as a table and names its data file.

## Services

Every service is feature-detected; a missing key disables that feature and nothing else.

| Service | Variables | Enables |
|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY`, `CHAT_MODEL` (default `claude-opus-5`) | the assistant |
| Neon Postgres + pgvector | `DATABASE_URL` | retrieval, contact persistence, analytics |
| Voyage | `VOYAGE_API_KEY`, `VOYAGE_MODEL` | query and document embeddings |
| Upstash Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | durable rate limiting and counters |
| Resend | `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | contact-form email |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | error monitoring |
| Site URL | `NEXT_PUBLIC_SITE_URL` | canonical, sitemap and Open Graph URLs |
| Metrics | `METRICS_TOKEN` | `GET /api/metrics` |

With `claude-opus-5` (or a Fable model) the chat route sends low effort and server-side refusal fallbacks;
if `CHAT_MODEL` names an older model those parameters are left off.

## Deploy

Vercel builds `main` to production. Other branches get preview deployments, which have no environment
variables, so the assistant is hidden there and the contact form reports that it could not send.

After changing `data/knowledge.json`, run `npm run db:migrate` once if the schema is new, then `npm run embed`
with the production `DATABASE_URL` and `VOYAGE_API_KEY` in `.env.local`.
