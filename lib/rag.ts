import knowledge from "@/data/knowledge.json";
import { sql } from "@/lib/db";

export type Chunk = { id: string; title: string; text: string; score?: number };
export type Retrieval = { mode: "rag" | "full"; chunks: Chunk[] };

// Offline / no-database fallback: the whole knowledge base, bundled at build time.
const JSON_CHUNKS: Chunk[] = (knowledge as any).chunks;

async function embedQuery(text: string): Promise<number[] | null> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      input: [text],
      model: process.env.VOYAGE_MODEL || "voyage-3-lite",
      input_type: "query",
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.[0]?.embedding ?? null;
}

// All chunks straight from the DB (used when retrieval isn't possible but the DB is up).
async function fullContextFromDb(): Promise<Retrieval> {
  if (!sql) return { mode: "full", chunks: JSON_CHUNKS };
  try {
    const rows = await sql`SELECT id, title, body AS text FROM kb_chunks`;
    if (rows.length) return { mode: "full", chunks: rows as Chunk[] };
  } catch {
    /* fall through to JSON */
  }
  return { mode: "full", chunks: JSON_CHUNKS };
}

/**
 * Return the most relevant chunks for a query.
 *  - DB + Voyage available  → real vector retrieval (cosine top-k via pgvector).
 *  - DB only                → full context from the DB.
 *  - neither                → full context from the bundled JSON (original behavior).
 */
export async function retrieve(query: string, k = 4): Promise<Retrieval> {
  if (!sql) return { mode: "full", chunks: JSON_CHUNKS };
  if (!process.env.VOYAGE_API_KEY) return fullContextFromDb();

  const qvec = await embedQuery(query);
  if (!qvec) return fullContextFromDb();

  try {
    const lit = `[${qvec.join(",")}]`;
    const rows = await sql`
      SELECT id, title, body AS text, 1 - (embedding <=> ${lit}::vector) AS score
      FROM kb_chunks
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${lit}::vector
      LIMIT ${k}`;
    if (rows.length) return { mode: "rag", chunks: rows as Chunk[] };
    return fullContextFromDb();
  } catch {
    return fullContextFromDb();
  }
}

export function buildContext(chunks: Chunk[]): string {
  return chunks.map((c) => `## ${c.title}\n${c.text}`).join("\n\n");
}
