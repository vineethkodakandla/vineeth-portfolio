import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { retrieve, buildContext } from "@/lib/rag";
import { chatLimiter, checkLimit } from "@/lib/ratelimit";
import { chatBodySchema } from "@/lib/validation";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = (context: string) => `You are the assistant on Vineeth Reddy Kodakandla's portfolio website. You answer questions from recruiters, hiring managers, and engineers about Vineeth — his projects, skills, experience, and what he's looking for.

Rules:
- Answer ONLY from the context below. If something isn't covered, say you don't have that detail and suggest they reach out via the contact section — never invent facts, employers, dates, or metrics.
- Speak about Vineeth in the third person, warm and concise. Aim for 2–4 sentences unless asked for depth.
- You're representing a real job candidate. Be confident and specific about what's in the context; don't oversell or use hype.
- If asked something off-topic (not about Vineeth), gently redirect.

CONTEXT:
${context}`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Server missing ANTHROPIC_API_KEY", { status: 500 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const allowed = await checkLimit(chatLimiter, ip, 12, "chat");
  if (!allowed) {
    return new Response("Slow down a moment, then try again.", { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const parsed = chatBodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Bad request", { status: 400 });
  }
  const messages = parsed.data.messages;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const { chunks, mode } = await retrieve(lastUser?.content || "", 4);
  const system = SYSTEM(buildContext(chunks));
  const sources = chunks.map((c) => ({
    id: c.id,
    title: c.title,
    score: c.score ?? null,
  }));

  const model = process.env.CHAT_MODEL || "claude-haiku-4-5-20251001";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Sources are known before streaming starts: emit them as a one-line JSON
      // preamble followed by a newline, then the answer tokens. JSON.stringify
      // never emits a newline, so the client splits on the FIRST "\n" to get
      // { metadata } | answer — a single plain-text stream, no SSE library.
      controller.enqueue(
        encoder.encode(JSON.stringify({ type: "sources", mode, sources }) + "\n")
      );
      try {
        const claude = anthropic.messages.stream({
          model,
          max_tokens: 1024,
          system,
          messages: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });
        claude.on("text", (t) => controller.enqueue(encoder.encode(t)));
        await claude.finalMessage();
        controller.close();
      } catch (err) {
        Sentry.captureException(err);
        controller.enqueue(
          encoder.encode("\n\n[Something went wrong reaching the model.]")
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
