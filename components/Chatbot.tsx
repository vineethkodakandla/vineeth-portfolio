"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@/components/ChatProvider";
import SectionLink from "@/components/SectionLink";

type Source = { id: string; title: string; score: number | null };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[]; error?: boolean };

const SUGGESTIONS = [
  "What did bitwise-forensics find?",
  "What inference work has he done?",
  "What is his work authorization?",
  "Which roles is he looking for?",
];

const GREETING =
  "Hi. I answer questions about Vineeth's work from a short knowledge base written to match this site. Ask about a project, his experience, or what he is looking for.";

// Matches the server's per-message limit (lib/validation.ts).
const MAX_TURN_CHARS = 2000;

// Sent by the chat route when the model declines mid-answer; the partial text is
// then replaced rather than left on screen above a note.
const REFUSAL_MARK = "[[refusal]]";
const REFUSAL_TEXT = "I can't help with that one. The contact section has other ways to reach Vineeth.";
const MARK_WITH_BREAK = "\n" + REFUSAL_MARK;

// While the stream is open, hold back text that could be the start of the marker.
function holdBack(s: string) {
  for (let k = Math.min(MARK_WITH_BREAK.length - 1, s.length); k > 0; k--) {
    if (s.endsWith(MARK_WITH_BREAK.slice(0, k))) return s.slice(0, -k);
  }
  return s;
}

// Where each knowledge-base chunk lives on the site, so a source chip can link to it.
// scripts/check-content.mjs checks these keys against data/knowledge.json.
const SOURCE_LINKS: Record<string, string> = {
  bitwise: "/work/bitwise-forensics",
  "edge-vision": "/work/meteor-lake-latency-lab",
  "eval-observatory": "/work/llm-eval-observatory",
  edith: "/#work",
  ananta: "/#work",
  site: "/#work",
  "experience-exl": "/#experience",
  "experience-ltts": "/#experience",
  education: "/#experience",
  skills: "/#experience",
  approach: "/#about",
  intro: "/",
  "looking-for": "/#contact",
  "faq-authorization": "/#contact",
  contact: "/#contact",
};

// Minimal renderer: **bold** and line breaks only, never HTML.
function renderRich(text: string) {
  return text.split("\n").map((line, li, lines) => (
    <span key={li}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        /^\*\*[^*]+\*\*$/.test(part) ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
      )}
      {li < lines.length - 1 && <br />}
    </span>
  ));
}

export default function Chatbot() {
  const { enabled, open, setOpen } = useChat();
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // One polite announcement per exchange, instead of a live region that re-reads
  // the answer on every streamed chunk.
  const [announce, setAnnounce] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  useEffect(() => {
    const body = bodyRef.current;
    // "auto" defers to the CSS scroll-behavior, which respects reduced motion.
    if (body) body.scrollTo({ top: body.scrollHeight, behavior: "auto" });
  }, [messages, open]);

  const dismiss = () => {
    restoreFocus.current = true;
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") dismiss();
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
    // Closed by the user from inside the panel: return focus to the launcher.
    if (restoreFocus.current) {
      restoreFocus.current = false;
      launcherRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!enabled) return null;

  const replaceLast = (msg: Msg) =>
    setMessages((m) => {
      const c = [...m];
      c[c.length - 1] = msg;
      return c;
    });

  const fail = (content: string) => {
    replaceLast({ role: "assistant", content, error: true });
    setAnnounce(content);
  };

  async function send(text: string) {
    const q = text.trim().slice(0, MAX_TURN_CHARS);
    if (!q || busy) return;
    inputRef.current?.focus();
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setAnnounce("Writing an answer");

    // Only real turns go back to the server: no error bubbles, nothing empty.
    const history = next
      .filter((m) => !m.error && m.content.trim())
      .slice(-10)
      .map(({ role, content }) => ({ role, content: content.slice(0, MAX_TURN_CHARS) }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        fail(
          res.status === 429
            ? "That is a lot of questions at once. Please wait a moment and try again."
            : res.status === 503
              ? "The assistant is not available right now. The contact section has other ways to reach Vineeth."
              : "Sorry, I could not reach the model just now. The contact section has other ways to reach Vineeth.",
        );
        return;
      }

      // The first line of the stream is a JSON preamble with the sources; the rest
      // is the answer text.
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let raw = "";
      let delim = -1;
      let answer = "";
      let refused = false;
      let sources: Source[] | undefined;
      while (true) {
        const { value, done } = await reader.read();
        raw += done ? dec.decode() : dec.decode(value, { stream: true });
        if (delim === -1) {
          delim = raw.indexOf("\n");
          if (delim === -1) {
            if (done) break;
            continue;
          }
          try {
            const meta = JSON.parse(raw.slice(0, delim));
            if (meta?.type === "sources") sources = meta.sources;
          } catch {
            /* not a preamble; drop the first line */
          }
        }
        const body = raw.slice(delim + 1);
        if (body.includes(REFUSAL_MARK)) {
          refused = true;
          if (!done) await reader.cancel().catch(() => {});
          break;
        }
        // Once the stream has ended nothing more can arrive, so show all of it.
        answer = done ? body : holdBack(body);
        replaceLast({ role: "assistant", content: answer, sources });
        if (done) break;
      }

      if (refused) fail(REFUSAL_TEXT);
      else if (!answer.trim()) fail("I did not get an answer that time. Please ask again.");
      else setAnnounce(answer);
    } catch {
      fail("Network problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button ref={launcherRef} className="cb-launch" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5Z" />
        </svg>
        Ask about my work
      </button>
    );
  }

  const last = messages[messages.length - 1];
  const waiting = busy && last.role === "assistant" && last.content === "";

  return (
    <div className="cb-panel" role="dialog" aria-modal="false" aria-labelledby="cb-title">
      <div className="cb-head">
        <div>
          <div className="title" id="cb-title">
            Ask about my work
          </div>
          <div className="sub">Answers are written by Claude from this site&apos;s knowledge base.</div>
        </div>
        <button className="icon-button x" onClick={dismiss} aria-label="Close assistant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="cb-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`cb-msg ${m.role === "user" ? "user" : "bot"}`}>
            {m.role === "assistant" ? renderRich(m.content) : m.content}
            {waiting && i === messages.length - 1 ? (
              <span className="cb-typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            ) : null}
            {m.role === "assistant" && m.sources && m.sources.length > 0 && m.content ? (
              <div className="cb-sources">
                <span className="cb-sources-label">From:</span>
                {m.sources.map((s) =>
                  SOURCE_LINKS[s.id] ? (
                    <SectionLink
                      key={s.id}
                      href={SOURCE_LINKS[s.id]}
                      className="cb-source-chip"
                      onClick={() => setOpen(false)}
                    >
                      {s.title}
                    </SectionLink>
                  ) : (
                    <span key={s.id} className="cb-source-chip">
                      {s.title}
                    </span>
                  ),
                )}
              </div>
            ) : null}
          </div>
        ))}
        {messages.length === 1 ? (
          <div className="cb-suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
      <p className="cb-disclaimer">Generated answers can be wrong. The site&apos;s own pages are the record.</p>
      <form
        className="cb-foot"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          ref={inputRef}
          value={input}
          placeholder="Ask a question"
          onChange={(e) => setInput(e.target.value)}
          readOnly={busy}
          aria-busy={busy}
          aria-label="Ask a question"
          maxLength={MAX_TURN_CHARS}
        />
        <button className="button primary" type="submit" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
