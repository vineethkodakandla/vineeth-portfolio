// Embeds the knowledge base into pgvector so the chatbot can do real retrieval.
// Run after every edit to data/knowledge.json:  npm run embed
// Requires DATABASE_URL (Neon) and VOYAGE_API_KEY in the environment.
//
// The table is made to match the file exactly: chunks are upserted, and rows
// whose id is no longer in the file are deleted, so a removed or renamed chunk
// cannot keep answering questions.

import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

const DB = process.env.DATABASE_URL;
const KEY = process.env.VOYAGE_API_KEY;
const MODEL = process.env.VOYAGE_MODEL || "voyage-3-lite";
const DIM = 512; // voyage-3-lite output dimension; must match kb_chunks.embedding vector(512)

if (!DB) {
  console.error("DATABASE_URL is not set. Run `npm run db:migrate` first and add it to .env.local.");
  process.exit(1);
}
if (!KEY) {
  console.error(
    "VOYAGE_API_KEY is not set. Get a key at https://www.voyageai.com\n" +
      "(The site still works without it, in full-context mode.)",
  );
  process.exit(1);
}

const sql = neon(DB);
const root = process.cwd();
const kb = JSON.parse(fs.readFileSync(path.join(root, "data", "knowledge.json"), "utf-8"));
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
  const ids = chunks.map((c) => c.id);
  if (new Set(ids).size !== ids.length) throw new Error("knowledge.json has duplicate chunk ids");

  console.log(`Embedding ${chunks.length} chunks with ${MODEL}...`);
  const embeddings = await embedAll(chunks.map((c) => `${c.title}\n${c.text}`));

  embeddings.forEach((e, i) => {
    if (e.length !== DIM) {
      throw new Error(
        `Embedding for "${chunks[i].id}" has ${e.length} dims, expected ${DIM}. ` +
          `If you changed VOYAGE_MODEL, update the vector(${e.length}) column in scripts/migrate.mjs.`,
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

  const removed = await sql`DELETE FROM kb_chunks WHERE NOT (id = ANY(${ids})) RETURNING id`;
  console.log(
    `Upserted ${chunks.length} chunks` +
      (removed.length ? `; removed ${removed.length} stale: ${removed.map((r) => r.id).join(", ")}` : "; nothing stale") +
      ".",
  );
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
