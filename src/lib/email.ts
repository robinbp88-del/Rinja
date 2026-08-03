type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/** Send via Resend. No-ops (returns skipped) if env is missing. */
export async function sendEmail(
  input: SendEmailInput,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    console.warn(
      "Email skipped: set RESEND_API_KEY and EMAIL_FROM in production env.",
    );
    return { ok: false, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<pre style="font-family:sans-serif">${escapeHtml(input.text)}</pre>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Resend error:", response.status, body);
    return { ok: false, error: body.slice(0, 200) };
  }

  return { ok: true };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
