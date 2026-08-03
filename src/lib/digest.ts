import { sendEmail } from "./email";
import { createServiceClient } from "./supabase.server";
import type { EmailDigest } from "./preferences";

type DigestItem = {
  title: string;
  body: string;
  created_at: string;
};

export async function getUserEmailDigest(
  userId: string,
): Promise<EmailDigest> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("user_preferences")
    .select("email_digest")
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.email_digest as EmailDigest | undefined) ?? "none";
}

export async function sendImmediateChangeEmail(input: {
  userId: string;
  toEmail: string;
  watchLabel: string;
  title: string;
  body: string;
}): Promise<void> {
  const digest = await getUserEmailDigest(input.userId);
  if (digest !== "immediate") return;

  await sendEmail({
    to: input.toEmail,
    subject: `Rinja · ${input.title}`,
    text: `${input.watchLabel}\n\n${input.body}\n\nOpen Rinja to see details.`,
  });
}

export async function runDailyDigests(): Promise<{
  users: number;
  sent: number;
  skipped: number;
  errors: number;
}> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();

  // Anyone with a change notification in the window is a digest candidate.
  const { data: recent, error: recentError } = await supabase
    .from("notifications")
    .select("user_id")
    .gt("created_at", since)
    .neq("title", "I'm watching");

  if (recentError) throw recentError;

  const userIds = [...new Set((recent ?? []).map((r) => r.user_id as string))];

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const userId of userIds) {
    const { data: pref } = await supabase
      .from("user_preferences")
      .select("email_digest, digest_last_sent_at")
      .eq("user_id", userId)
      .maybeSingle();

    const mode = (pref?.email_digest as EmailDigest | undefined) ?? "none";
    if (mode !== "daily") {
      skipped += 1;
      continue;
    }

    const last = pref?.digest_last_sent_at
      ? new Date(pref.digest_last_sent_at).getTime()
      : 0;
    if (last && Date.now() - last < 20 * 60 * 60 * 1000) {
      skipped += 1;
      continue;
    }

    const windowStart = pref?.digest_last_sent_at ?? since;

    const { data: notes, error: notesError } = await supabase
      .from("notifications")
      .select("title, body, created_at")
      .eq("user_id", userId)
      .gt("created_at", windowStart)
      .neq("title", "I'm watching")
      .order("created_at", { ascending: false })
      .limit(40);

    if (notesError) {
      console.error("Digest query failed:", notesError.message);
      errors += 1;
      continue;
    }

    const items = (notes ?? []) as DigestItem[];
    if (items.length === 0) {
      skipped += 1;
      continue;
    }

    const email = await resolveUserEmail(userId);
    if (!email) {
      skipped += 1;
      continue;
    }

    const subject =
      items.length === 1
        ? "Rinja · 1 watch changed today"
        : `Rinja · ${items.length} watches changed today`;

    const lines = items.map(
      (n, i) => `${i + 1}. ${n.title}\n   ${n.body}`,
    );
    const text = `${subject}\n\n${lines.join("\n\n")}\n\nOpen Rinja for the full list.`;

    const result = await sendEmail({ to: email, subject, text });
    if (result.skipped) {
      skipped += 1;
      continue;
    }
    if (!result.ok) {
      errors += 1;
      continue;
    }

    await supabase.from("user_preferences").upsert(
      {
        user_id: userId,
        email_digest: "daily",
        digest_last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    sent += 1;
  }

  return {
    users: userIds.length,
    sent,
    skipped,
    errors,
  };
}

async function resolveUserEmail(userId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    console.warn("Could not resolve user email:", error.message);
    return null;
  }
  return data.user.email ?? null;
}
