"use client";
import { useEffect, useRef, useState } from "react";
import { contactBodySchema } from "@/lib/validation";

type Status = "idle" | "sending" | "ok" | "error";
type Field = "name" | "email" | "message";

const FIELD_MESSAGES: Record<Field, string> = {
  name: "Enter your name.",
  email: "Enter an email address like name@example.com.",
  message: "Write a message (up to 4,000 characters).",
};

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [err, setErr] = useState<string | null>(null);
  // Changing the key remounts the alert, so a repeated error is announced again.
  const [attempt, setAttempt] = useState(0);
  const doneRef = useRef<HTMLParagraphElement>(null);
  const fieldRefs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };

  useEffect(() => {
    if (status === "ok") doneRef.current?.focus();
  }, [status]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (k !== "company" && fieldErrors[k]) setFieldErrors((fe) => ({ ...fe, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setAttempt((a) => a + 1);

    // The same schema the server applies, so both sides accept the same input.
    const checked = contactBodySchema.safeParse(form);
    if (!checked.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of checked.error.issues) {
        const field = issue.path[0];
        if (field === "name" || field === "email" || field === "message") next[field] = FIELD_MESSAGES[field];
      }
      setFieldErrors(next);
      const first = (["name", "email", "message"] as Field[]).find((f) => next[f]);
      if (first) {
        setErr("Please fix the highlighted fields.");
        fieldRefs[first].current?.focus();
        return;
      }
    }
    setFieldErrors({});

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
        setErr("Too many messages from this connection. Please try again later, or email me directly.");
      } else {
        setStatus("error");
        setErr("The message did not go through. Please email me directly instead.");
      }
    } catch {
      setStatus("error");
      setErr("Network error. Please email me directly instead.");
    }
  }

  if (status === "ok") {
    return (
      <p ref={doneRef} tabIndex={-1} className="contact-success">
        Thanks, your message was sent. I will reply by email.
      </p>
    );
  }

  const describedBy = (f: Field) => (fieldErrors[f] ? `cf-${f}-err` : undefined);

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <div className="cf-row">
        <div className="cf-field">
          <label htmlFor="cf-name">Name</label>
          <input
            ref={fieldRefs.name}
            id="cf-name"
            className="cf-input"
            name="name"
            value={form.name}
            onChange={set("name")}
            autoComplete="name"
            required
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={describedBy("name")}
          />
          {fieldErrors.name ? (
            <p id="cf-name-err" className="cf-field-error">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div className="cf-field">
          <label htmlFor="cf-email">Email</label>
          <input
            ref={fieldRefs.email}
            id="cf-email"
            className="cf-input"
            name="email"
            type="email"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
            required
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={describedBy("email")}
          />
          {fieldErrors.email ? (
            <p id="cf-email-err" className="cf-field-error">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
      </div>
      <div className="cf-field">
        <label htmlFor="cf-message">Message</label>
        <textarea
          ref={fieldRefs.message}
          id="cf-message"
          className="cf-input cf-textarea"
          name="message"
          value={form.message}
          onChange={set("message")}
          rows={5}
          required
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={describedBy("message")}
        />
        {fieldErrors.message ? (
          <p id="cf-message-err" className="cf-field-error">
            {fieldErrors.message}
          </p>
        ) : null}
      </div>
      {/* Honeypot: hidden from people; bots that fill it are silently dropped. */}
      <input
        className="cf-hp"
        tabIndex={-1}
        autoComplete="off"
        name="company"
        value={form.company}
        onChange={set("company")}
        aria-hidden="true"
      />
      {err ? (
        <div key={attempt} className="cf-error" role="alert">
          {err}
        </div>
      ) : null}
      <button className="button primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending" : "Send message"}
      </button>
      <p className="cf-note">Messages are stored with the sender&apos;s IP address and browser user agent, to limit abuse.</p>
    </form>
  );
}
