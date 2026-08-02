import { supabase } from "./supabase";

export type DatabaseNotification = {
  id: string;
  user_id: string;
  watch_id: string | null;
  title: string;
  body: string;
  old_value: string | null;
  new_value: string | null;
  read: boolean;
  created_at: string;
};

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");

  return user;
}

export async function getNotifications(): Promise<DatabaseNotification[]> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []) as DatabaseNotification[];
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) throw error;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await requireUser();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) throw error;

  return count ?? 0;
}

export async function createStartedNotification(input: {
  watchId: string;
  label: string;
  host: string;
}): Promise<void> {
  const user = await requireUser();

  const { error } = await supabase.from("notifications").insert({
    user_id: user.id,
    watch_id: input.watchId,
    title: "I'm watching",
    body: `👀 On it — ${input.label} · ${input.host}`,
    read: false,
  });

  if (error) throw error;
}
