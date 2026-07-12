/**
 * Email adapter. In-app notifications always work; email is best-effort.
 *
 *  - When RESEND_API_KEY is set, messages are sent through the Resend HTTP API
 *    (no SDK dependency — just fetch).
 *  - When it is not set (the default in development), the message is logged to
 *    the server console and reported as not delivered, so nothing crashes.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailResult {
  delivered: boolean;
  via: "resend" | "console";
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "VerdantIQ <no-reply@verdantiq.demo>";

  if (!apiKey) {
    console.info(
      `[email:dev] → to=${message.to} · subject="${message.subject}" (no RESEND_API_KEY; not sent)`,
    );
    return { delivered: false, via: "console" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html ?? `<p>${message.text ?? ""}</p>`,
        text: message.text,
      }),
    });
    return { delivered: res.ok, via: "resend" };
  } catch (error) {
    console.error("[email] Resend request failed:", error);
    return { delivered: false, via: "resend" };
  }
}
