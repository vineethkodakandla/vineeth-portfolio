"use client";
import { useState } from "react";

type Status = "idle" | "sending" | "ok" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "" });
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErr("Please fill in your name, email, and a message.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus("ok");
        setForm({ name: "", email: "", message: "", company: "" });
      } else if (res.status === 429) {
        setStatus("error");
        setErr("That's a lot of messages — please try again a little later.");
      } else {
        setStatus("error");
        setErr("Something went wrong. You can email me directly instead.");
      }
    } catch {
      setStatus("error");
      setErr("Network error. You can email me directly instead.");
    }
  }

  if (status === "ok") {
    return (
      <div className="contact-form contact-success" role="status">
        ✓ Thanks — your message is on its way. I&apos;ll get back to you soon.
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <div className="cf-row">
        <input
          className="cf-input"
          name="name"
          placeholder="Your name"
          value={form.name}
          onChange={set("name")}
          aria-label="Your name"
          autoComplete="name"
          required
        />
        <input
          className="cf-input"
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={set("email")}
          aria-label="Your email"
          autoComplete="email"
          required
        />
      </div>
      <textarea
        className="cf-input cf-textarea"
        name="message"
        placeholder="What are you building?"
        value={form.message}
        onChange={set("message")}
        aria-label="Your message"
        rows={4}
        required
      />
      {/* Honeypot: hidden from humans; bots that fill it are silently dropped. */}
      <input
        className="cf-hp"
        tabIndex={-1}
        autoComplete="off"
        name="company"
        value={form.company}
        onChange={set("company")}
        aria-hidden="true"
      />
      {err && (
        <div className="cf-error" role="alert">
          {err}
        </div>
      )}
      <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message →"}
      </button>
    </form>
  );
}
