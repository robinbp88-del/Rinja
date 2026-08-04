import { supabase } from "./supabase";

/** Best-effort heartbeat so admin can see "active" users. */
export async function touchUserActivity(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date().toISOString();
    await supabase.from("user_activity").upsert(
      { user_id: user.id, last_seen_at: now },
      { onConflict: "user_id" },
    );
  } catch {
    // Table may not exist yet / offline — ignore.
  }
}
