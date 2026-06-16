"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@/components/ChatProvider";

type Source = { id: string; title: string; score: number | null };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[] };

const SUGGESTIONS = [
  "What's his strongest project?",
  "Is he a good fit for a Forward Deployed role?",
  "What's his experience with RAG?",
  "What's he looking for?",
];

const GREETING =
  "Hi — I'm Vineeth's portfolio assistant. Ask me about his projects, skills, or what he's looking for.";

// Lightweight, dependency-free renderer: turns **bold** into <strong> and
// preserves line breaks. The model answers in Markdown; this renders it so
// raw ** never shows up in the bubble.
function renderRich(text: string) {
  return text.split("\n").map((line, li, lines) => (
    <span key={li}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        /^\*\*[^*]+\*\*$/.test(part) ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      )}
      {li < lines.length - 1 && <br />}
    </span>
  ));
}

export default function Chatbot() {
  const { open, setOpen } = useChat();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Focus the input when the panel opens; allow Esc to close.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        const msg =
          res.status === 429
            ? "That's a lot of questions at once — give it a moment and try again."
            : "Sorry, I couldn't reach the model just now.";
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: msg };
          return c;
        });
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let raw = "";
      let delim = -1; // index of the newline separating the sources preamble from the answer
      let sources: Source[] | undefined;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        raw += dec.decode(value, { stream: true });
        if (delim === -1) {
          delim = raw.indexOf("\n");
          if (delim === -1) continue; // preamble line not fully received yet
          try {
            const meta = JSON.parse(raw.slice(0, delim));
            if (meta?.type === "sources") sources = meta.sources;
          } catch {
            /* not our preamble (shouldn't happen) — fall through, drop first line */
          }
        }
        const answer = raw.slice(delim + 1);
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: answer, sources };
          return c;
        });
      }
    } catch {
      setMessages((m) => {
        const c = [...m];
        c[c.length - 1] = { role: "assistant", content: "Network hiccup — please try again." };
        return c;
      });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="cb-launch" onClick={() => setOpen(true)} aria-label="Open chat">
        <span className="dot" /> Ask about Vineeth
      </button>
    );
  }

  const last = messages[messages.length - 1];
  const showSkeleton = busy && last.role === "assistant" && last.content === "";

  return (
    <div
      className="cb-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio assistant"
    >
      <div className="cb-head">
        <span className="dot" />
        <div>
          <div className="title">Ask my portfolio</div>
          <div className="sub">RAG over Vineeth&apos;s work · powered by Claude</div>
        </div>
        <button className="x" onClick={() => setOpen(false)} aria-label="Close">
          ×
        </button>
      </div>

      <div className="cb-body" ref={bodyRef} role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`cb-msg ${m.role === "user" ? "user" : "bot"}`}>
            {m.role === "assistant" ? renderRich(m.content) : m.content}
            {showSkeleton && i === messages.length - 1 && (
              <span className="cb-skeleton" aria-label="Assistant is typing">
                <i />
                <i />
                <i />
              </span>
            )}
            {m.role === "assistant" && m.sources && m.sources.length > 0 && (
              <div className="cb-sources">
                <span className="cb-sources-label">sources</span>
                {m.sources.map((s) => (
                  <span
                    key={s.id}
                    className="cb-source-chip"
                    title={
                      s.score != null
                        ? `relevance ${Math.round(s.score * 100)}%`
                        : undefined
                    }
                  >
                    {s.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {messages.length === 1 && (
          <div className="cb-suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="cb-foot">
        <input
          ref={inputRef}
          value={input}
          placeholder="Ask a question…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(input);
          }}
          disabled={busy}
          aria-label="Ask a question"
        />
        <button onClick={() => send(input)} disabled={busy || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
