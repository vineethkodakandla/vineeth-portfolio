import knowledge from "@/data/knowledge.json";
import { sql } from "@/lib/db";

export type Chunk = { id: string; title: string; text: string; score?: number };
export type Retrieval = { mode: "rag" | "full"; chunks: Chunk[] };

// The bundled knowledge base is the only source of answer text. It ships with the
// deployed pages, so the assistant cannot describe a different revision of the
// site than the one being served, whatever order a deploy and `npm run embed`
// happen in. The database only ranks chunk ids; if its rows do not match the
// bundle (embedded from another revision), the whole bundle is used instead.
const JSON_CHUNKS: Chunk[] = (knowledge as { chunks: Chunk[] }).chunks;
const BY_ID = new Map(JSON_CHUNKS.map((c) => [c.id, c]));
const FULL: Retrieval = { mode: "full", chunks: JSON_CHUNKS };
const TIMEOUT_MS = 4000;

function withTimeout<T>(work: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
    Promise.resolve(work).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function embedQuery(text: string): Promise<number[] | null> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        input: [text],
        model: process.env.VOYAGE_MODEL || "voyage-3-lite",
        input_type: "query",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const vector = json?.data?.[0]?.embedding;
    return Array.isArray(vector) ? vector : null;
  } catch {
    return null; // timeout, network error or a non-JSON body: fall back to full context
  }
}

/**
 * The most relevant chunks for a query.
 *  - DB + Voyage available and the table matches the bundle: top-k by cosine similarity.
 *  - anything else: the whole bundled knowledge base.
 */
export async function retrieve(query: string, k = 5): Promise<Retrieval> {
  if (!sql || !process.env.VOYAGE_API_KEY) return FULL;
  const qvec = await embedQuery(query);
  if (!qvec) return FULL;

  try {
    const lit = `[${qvec.join(",")}]`;
    const rows = (await withTimeout(
      sql`
        SELECT id, title, body, 1 - (embedding <=> ${lit}::vector) AS score
        FROM kb_chunks
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${lit}::vector
        LIMIT ${k}`,
      TIMEOUT_MS,
    )) as { id: string; title: string; body: string; score: number | string }[];

    const chunks: Chunk[] = [];
    for (const row of rows) {
      const bundled = BY_ID.get(row.id);
      if (!bundled || bundled.title !== row.title || bundled.text !== row.body) return FULL;
      chunks.push({ ...bundled, score: Number(row.score) });
    }
    return chunks.length ? { mode: "rag", chunks } : FULL;
  } catch {
    return FULL;
  }
}

export function buildContext(chunks: Chunk[]): string {
  return chunks.map((c) => `## ${c.title}\n${c.text}`).join("\n\n");
}
