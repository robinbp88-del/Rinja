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

/** Log Home URL paste / Search query for admin stats. */
export async function logSearchEvent(query: string): Promise<void> {
  const q = query.replace(/\s+/g, " ").trim().slice(0, 300);
  if (!q) return;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("search_events").insert({
      user_id: user.id,
      query: q,
    });
    if (error) {
      console.warn("search_events log failed:", error.message);
    }
  } catch {
    // ignore
  }
}
