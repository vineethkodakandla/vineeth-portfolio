// Embeds the knowledge base into pgvector so the chatbot can do real retrieval.
// Run once, and after editing data/knowledge.json:  npm run embed
// Requires DATABASE_URL (Neon) and VOYAGE_API_KEY in the environment.

import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

const DB = process.env.DATABASE_URL;
const KEY = process.env.VOYAGE_API_KEY;
const MODEL = process.env.VOYAGE_MODEL || "voyage-3-lite";
const DIM = 512; // voyage-3-lite output dimension — must match kb_chunks.embedding vector(512)

if (!DB) {
  console.error("✗ DATABASE_URL is not set. Run `npm run db:migrate` first and add it to .env.local.");
  process.exit(1);
}
if (!KEY) {
  console.error(
    "✗ VOYAGE_API_KEY is not set. Get a free key at https://www.voyageai.com\n" +
      "  (The site still works without this — it just runs in full-context mode.)"
  );
  process.exit(1);
}

const sql = neon(DB);
const root = process.cwd();
const kb = JSON.parse(
  fs.readFileSync(path.join(root, "data", "knowledge.json"), "utf-8")
);
const chunks = kb.chunks;

async function embedAll(texts) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({ input: texts, model: MODEL, input_type: "document" }),
  });
  if (!res.ok) {
    throw new Error(`Voyage error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

const main = async () => {
  console.log(`Embedding ${chunks.length} chunks with ${MODEL}…`);
  const texts = chunks.map((c) => `${c.title}\n${c.text}`);
  const embeddings = await embedAll(texts);

  // Guard against a dimension mismatch (e.g. if VOYAGE_MODEL was changed).
  embeddings.forEach((e, i) => {
    if (e.length !== DIM) {
      throw new Error(
        `Embedding for "${chunks[i].id}" has ${e.length} dims, expected ${DIM}. ` +
          `If you changed VOYAGE_MODEL, update the vector(${e.length}) column dimension in scripts/migrate.mjs.`
      );
    }
  });

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const lit = `[${embeddings[i].join(",")}]`;
    await sql`
      INSERT INTO kb_chunks (id, title, body, embedding, updated_at)
      VALUES (${c.id}, ${c.title}, ${c.text}, ${lit}::vector, now())
      ON CONFLICT (id) DO UPDATE
        SET title = EXCLUDED.title,
            body = EXCLUDED.body,
            embedding = EXCLUDED.embedding,
            updated_at = now()`;
  }

  console.log(`✓ Upserted ${chunks.length} chunks with embeddings into kb_chunks. Retrieval is live.`);
};

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
