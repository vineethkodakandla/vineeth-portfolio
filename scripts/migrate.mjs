// Database migration: enables pgvector and creates the schema.
// Idempotent — safe to run repeatedly. Run with:  npm run db:migrate
// Requires DATABASE_URL (Neon) in the environment (.env.local sourced via --env-file).

import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "✗ DATABASE_URL is not set. Add your Neon connection string to .env.local.\n" +
      "  (The site still runs without a database — it falls back to the JSON knowledge base.)"
  );
  process.exit(1);
}

const sql = neon(url);

// Each statement runs on its own (Neon's HTTP driver executes one statement per call).
const statements = [
  `CREATE EXTENSION IF NOT EXISTS vector`,

  // 1. Knowledge-base chunks + embeddings (RAG). voyage-3-lite => 512 dims.
  `CREATE TABLE IF NOT EXISTS kb_chunks (
     id          TEXT PRIMARY KEY,
     title       TEXT NOT NULL,
     body        TEXT NOT NULL,
     embedding   vector(512),
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // HNSW cosine index: no training/lists tuning, no "build after load" footgun.
  `CREATE INDEX IF NOT EXISTS kb_chunks_embedding_hnsw
     ON kb_chunks USING hnsw (embedding vector_cosine_ops)`,

  // 2. Contact form submissions.
  `CREATE TABLE IF NOT EXISTS contact_submissions (
     id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     name        TEXT NOT NULL,
     email       TEXT NOT NULL,
     message     TEXT NOT NULL,
     ip          TEXT,
     user_agent  TEXT,
     email_sent  BOOLEAN NOT NULL DEFAULT false,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS contact_created_idx
     ON contact_submissions (created_at DESC)`,

  // 3. Page-view event log (durable analytics).
  `CREATE TABLE IF NOT EXISTS page_views (
     id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     path        TEXT NOT NULL,
     referrer    TEXT,
     country     TEXT,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS page_views_path_idx
     ON page_views (path, created_at DESC)`,

  // 4. Aggregate counters (fast reads for the UI; durable mirror of Redis counts).
  `CREATE TABLE IF NOT EXISTS view_counts (
     key         TEXT PRIMARY KEY,
     count       BIGINT NOT NULL DEFAULT 0,
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
];

const main = async () => {
  console.log(`Running ${statements.length} migration statements…`);
  for (const stmt of statements) {
    await sql.query(stmt);
    console.log("  ✓ " + stmt.split("\n")[0].trim().slice(0, 64));
  }
  console.log("✓ Migration complete.");
};

main().catch((e) => {
  console.error("✗ Migration failed:", e.message);
  process.exit(1);
});
