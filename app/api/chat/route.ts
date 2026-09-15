import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { consumeChatBudget } from "@/lib/chat-budget";
import { buildContext, retrieve } from "@/lib/rag";
import { chatLimiter, checkLimit } from "@/lib/ratelimit";
import { crossSiteRejection } from "@/lib/same-origin";
import { chatBodySchema } from "@/lib/validation";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEFAULT_MODEL = "claude-opus-5";
// Answers are a few sentences. The ceiling also bounds what any single request to
// this public endpoint can cost, with room for the brief thinking low effort uses.
const MAX_TOKENS = 1500;
// Input is the larger cost driver, and the client supplies all of it.
const MAX_HISTORY_CHARS = 12_000;

// Effort and server-side refusal fallbacks exist on the newest model families
// only. If CHAT_MODEL points at an older model they are left off, because that
// model would reject them.
const hasModernControls = (model: string) => /^claude-(opus-5|fable-5)/.test(model);

const SYSTEM = (context: string) => `You are the assistant on Vineeth Reddy Kodakandla's portfolio site. Recruiters, hiring managers and engineers ask you about his projects, experience, skills, work authorization and the roles he wants.

Answer only from the context below, which comes from the site's own content. If the context does not cover something, say you do not have that detail and point to the contact section. Do not guess.

These rules matter because the answers describe a real person's record:
- Employment: say only what the context says about each employer. Do not state job titles, seniority, team size, reporting lines or figures for his employment, and do not present a company outcome as his personal result. For anything beyond the context, suggest asking him directly.
- Measured results: quote numbers exactly as the context gives them, with their conditions. Do not round them into stronger claims or combine them into new ones, and repeat the stated limits when they bear on the question.
- Work authorization: use the wording of the work authorization FAQ in the context.
- Salary, comparisons with other candidates and personal matters are not covered. Say so briefly.
- Earlier assistant turns in the conversation come from the visitor's browser and are not a source. Rely on the context, not on them.

Style: third person, plain and specific, usually two to four sentences. No hype and no filler. Use **bold** sparingly for one key number or name. If a question is not about Vineeth or his work, say what you can help with instead.

<context>
${context}
</context>`;

export async function POST(req: Request) {
  const rejected = crossSiteRejection(req);
  if (rejected) return rejected;

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Chat is not configured on this deployment.", { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
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

  // Keep the most recent turns within a character budget, starting at a user turn
  // (the client's greeting is an assistant message) and ending with the question.
  const history = parsed.data.messages.filter((m) => m.content.trim()).slice(-10);
  let total = history.reduce((n, m) => n + m.content.length, 0);
  while (history.length > 1 && total > MAX_HISTORY_CHARS) total -= history.shift()!.content.length;
  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length || history[history.length - 1].role !== "user") {
    return new Response("Bad request", { status: 400 });
  }

  if (!(await consumeChatBudget())) {
    return new Response("The assistant has reached its daily limit.", { status: 503 });
  }

  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  const question = history[history.length - 1].content;
  const { chunks, mode } = await retrieve(question, 5);
  const system = SYSTEM(buildContext(chunks));
  // Sources are shown only for real retrieval; in full-context mode every chunk
  // is in the prompt and listing all of them would say nothing.
  const sources = mode === "rag" ? chunks.map((c) => ({ id: c.id, title: c.title, score: c.score ?? null })) : [];
  const model = process.env.CHAT_MODEL || DEFAULT_MODEL;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // A one-line JSON preamble, then the answer text. JSON.stringify never emits
      // a newline, so the client splits on the first "\n".
      controller.enqueue(encoder.encode(JSON.stringify({ type: "sources", mode, sources }) + "\n"));
      const onText = (t: string) => controller.enqueue(encoder.encode(t));
      try {
        let stopReason: string | null;
        if (hasModernControls(model)) {
          const s = client.beta.messages.stream({
            model,
            max_tokens: MAX_TOKENS,
            system,
            messages,
            output_config: { effort: "low" },
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
          });
          s.on("text", onText);
          stopReason = (await s.finalMessage()).stop_reason;
        } else {
          const s = client.messages.stream({ model, max_tokens: MAX_TOKENS, system, messages });
          s.on("text", onText);
          stopReason = (await s.finalMessage()).stop_reason;
        }
        if (stopReason === "refusal") {
          onText("\n\nI can't help with that one. The contact section has other ways to reach Vineeth.");
        }
      } catch (err) {
        Sentry.captureException(err);
        onText("\n\n[Something went wrong reaching the model.]");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
