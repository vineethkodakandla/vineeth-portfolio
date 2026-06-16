# Vineeth Reddy Kodakandla — Portfolio + RAG Chatbot

A production-grade Next.js 14 portfolio with a real **vector-RAG chatbot**, a
**data-driven** backend (Postgres + Redis), and **production hardening**
(durable rate limiting, validation, error monitoring, security headers, SEO).
Every external service is feature-detected — the app builds and runs even when a
key is missing, degrading gracefully.

```
app/
  page.tsx          the site (server component + client islands)
  layout.tsx        fonts, metadata, theme no-flash script, providers
  globals.css       dark/light theming via CSS variables
  api/
    chat/           RAG chatbot — retrieves context, streams Claude + sources
    contact/        validated, rate-limited; persists + emails
    track/ counts/  page-view + project-view analytics
    health/ metrics/ ops endpoints (metrics is token-guarded)
  opengraph-image · twitter-image · sitemap · robots   (SEO)
components/         AgentGraph, Chatbot, ContactForm, CommandPalette (⌘K),
                   ThemeToggle, ViewCount, Analytics, Motion, providers
lib/
  db.ts             Neon serverless Postgres client (null-safe)
  rag.ts            pgvector cosine top-k retrieval (+ JSON fallback)
  ratelimit.ts      Upstash sliding-window (+ in-memory fallback)
  validation.ts     zod request schemas
  analytics.ts · email.ts · cache helpers
scripts/
  migrate.mjs       creates pgvector extension + tables + HNSW index
  embed.mjs         embeds data/knowledge.json into pgvector
data/knowledge.json the chatbot's knowledge base (edit this)
```

## Run locally

```bash
npm install
cp .env.example .env.local      # add ANTHROPIC_API_KEY at minimum
npm run dev                     # http://localhost:3000
```

With only `ANTHROPIC_API_KEY`, the chatbot answers in **full-context mode** and
the rest of the site works; analytics/persistence no-op until a DB is added.

## Turn on real vector RAG + dynamic features

1. Create a **Neon** Postgres DB → put the pooled connection string in
   `DATABASE_URL`. Add a free **Voyage** key (`VOYAGE_API_KEY`).
2. `npm run db:migrate`   — enables pgvector, creates the schema.
3. `npm run embed`        — embeds the knowledge base into pgvector.
   (Re-run `embed` whenever you edit `data/knowledge.json`.)
4. Restart. The chatbot now retrieves the top-k relevant chunks per question and
   shows its **sources**; the contact form persists to Postgres; analytics record.

Optional services (each degrades gracefully if absent):

| Service | Var(s) | Enables |
|---|---|---|
| Upstash Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | durable rate limiting, caching, view counters |
| Resend | `RESEND_API_KEY`, `CONTACT_*_EMAIL` | contact-form email delivery |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN` (+ `SENTRY_*`) | error monitoring |
| Metrics | `METRICS_TOKEN` | `/api/metrics` access |

See `.env.example` for the full list and behavior-when-missing.

## Deploy (Vercel)

1. Push to GitHub, import at https://vercel.com/new.
2. Add the env vars from `.env.example` in Project Settings (Production + Preview).
   Set `NEXT_PUBLIC_SITE_URL` to your deployed URL (for SEO/OG/canonical).
3. Run the one-off setup against the production DB (locally with prod
   `DATABASE_URL`, or via the Vercel CLI):
   ```bash
   npm run db:migrate && npm run embed
   ```
   These are kept out of `build` so a deploy never fails on a DB hiccup.
4. Deploy.

## Ops

- `GET /api/health` — dependency probe (`{ db, redis, anthropic, … }`).
- `GET /api/metrics` — aggregates; requires `Authorization: Bearer $METRICS_TOKEN`.

## Notes

- Default chat model is Haiku (`CHAT_MODEL` to override, e.g. `claude-sonnet-4-6`).
- Security headers (incl. CSP, currently report-only) are set in `next.config.mjs`.
- Fonts use `next/font/google` (self-hosted at build by Next). The OpenGraph image
  uses `@vercel/og` and renders on Vercel; it may not render under a local Windows
  `next start` due to a WASM limitation.
```
