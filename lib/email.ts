import { Resend } from "resend";

// Null when RESEND_API_KEY is absent → contact submissions are still persisted,
// the email is just skipped (graceful degradation).
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function emailReady(): boolean {
  return resend !== null;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!
  );
}

export async function sendContactEmail(input: {
  name: string;
  email: string;
  message: string;
}): Promise<boolean> {
  if (!resend) return false;
  const to = process.env.CONTACT_TO_EMAIL || "vineethkodakandla@gmail.com";
  const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
  try {
    const { error } = await resend.emails.send({
      from: `Portfolio <${from}>`,
      to,
      replyTo: input.email,
      subject: `New portfolio message from ${input.name}`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="margin:0 0 12px">New message from your portfolio</h2>
        <p style="margin:4px 0"><strong>Name:</strong> ${escapeHtml(input.name)}</p>
        <p style="margin:4px 0"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p style="margin:12px 0 4px"><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;margin:0;color:#333">${escapeHtml(input.message)}</p>
      </div>`,
    });
    return !error;
  } catch {
    return false;
  }
}
