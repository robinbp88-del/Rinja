import { requireUser } from "./auth";
import { supabase } from "./supabase";

export type EmailDigest = "none" | "daily" | "immediate";

export type UserPreferences = {
  user_id: string;
  email_digest: EmailDigest;
  digest_last_sent_at: string | null;
  updated_at: string;
};

export const DIGEST_LABELS: Record<EmailDigest, string> = {
  none: "No emails",
  daily: "Daily summary",
  immediate: "Every change",
};

export async function getPreferences(): Promise<UserPreferences> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) return data as UserPreferences;

  // Default until the user saves a choice.
  return {
    user_id: user.id,
    email_digest: "daily",
    digest_last_sent_at: null,
    updated_at: new Date().toISOString(),
  };
}

export async function setEmailDigest(
  emailDigest: EmailDigest,
): Promise<UserPreferences> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        email_digest: emailDigest,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) throw error;

  return data as UserPreferences;
}
