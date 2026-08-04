import { createServerFn } from "@tanstack/react-start";
import { createClient, type User } from "@supabase/supabase-js";
import { z } from "zod";
import { isAdminUser } from "./admin";
import { createServiceClient } from "./supabase.server";

const TokenSchema = z.object({
  accessToken: z.string().min(20),
});

const SendSchema = z.object({
  accessToken: z.string().min(20),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(2000),
  /** Omit or null = every user; otherwise a user id. */
  recipientUserId: z.string().uuid().optional().nullable(),
  kind: z.enum(["direct", "broadcast", "promo"]).optional(),
});

export type InboxMessage = {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  title: string;
  body: string;
  kind: string;
  read: boolean;
  created_at: string;
};

export type InboxUserOption = {
  id: string;
  email: string | null;
};

async function requireUser(accessToken: string): Promise<User> {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error("Missing Supabase config");

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

async function requireAdmin(accessToken: string): Promise<User> {
  const user = await requireUser(accessToken);
  if (!isAdminUser(user)) throw new Error("Forbidden");
  return user;
}

async function listAllUserIds(supabase: ReturnType<typeof createServiceClient>): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.warn("listUsers for inbox failed:", error.message);
      break;
    }
    for (const u of data.users ?? []) ids.push(u.id);
    if ((data.users?.length ?? 0) < perPage) break;
    page += 1;
    if (page > 50) break;
  }
  return ids;
}

/** Messages for the signed-in user. */
export const listMyInboxMessages = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }): Promise<InboxMessage[]> => {
    const user = await requireUser(data.accessToken);
    const supabase = createServiceClient();
    const { data: rows, error } = await supabase
      .from("inbox_messages")
      .select("id, sender_user_id, recipient_user_id, title, body, kind, read, created_at")
      .eq("recipient_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("listMyInboxMessages failed:", error.message);
      throw new Error("Could not load inbox.");
    }
    return (rows ?? []) as InboxMessage[];
  });

/** Unread count for profile badge. */
export const getInboxUnreadCount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }): Promise<{ count: number }> => {
    const user = await requireUser(data.accessToken);
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from("inbox_messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_user_id", user.id)
      .eq("read", false);

    if (error) {
      // Migration may not be applied yet.
      console.warn("getInboxUnreadCount failed:", error.message);
      return { count: 0 };
    }
    return { count: count ?? 0 };
  });

export const markInboxMessagesRead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await requireUser(data.accessToken);
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("inbox_messages")
      .update({ read: true })
      .eq("recipient_user_id", user.id)
      .eq("read", false);

    if (error) {
      console.error("markInboxMessagesRead failed:", error.message);
      throw new Error("Could not mark messages as read.");
    }

    // Clear matching Alerts (inbox/system rows have no watch_id).
    const { error: alertErr } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .is("watch_id", null);

    if (alertErr) {
      console.warn("mark inbox alerts read failed:", alertErr.message);
    }

    return { ok: true as const };
  });

const MessageIdSchema = z.object({
  accessToken: z.string().min(20),
  messageId: z.string().uuid(),
});

/** Mark one inbox message as read (when user opens it). */
export const markInboxMessageRead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MessageIdSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await requireUser(data.accessToken);
    const supabase = createServiceClient();

    const { data: row, error } = await supabase
      .from("inbox_messages")
      .update({ read: true })
      .eq("id", data.messageId)
      .eq("recipient_user_id", user.id)
      .select("title")
      .maybeSingle();

    if (error) {
      console.error("markInboxMessageRead failed:", error.message);
      throw new Error("Could not mark message as read.");
    }

    if (row?.title) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .eq("title", row.title)
        .is("watch_id", null);
    }

    return { ok: true as const };
  });

/** Admin: users for recipient picker. */
export const listInboxRecipients = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }): Promise<InboxUserOption[]> => {
    await requireAdmin(data.accessToken);
    const supabase = createServiceClient();
    const options: InboxUserOption[] = [];
    let page = 1;
    const perPage = 200;
    for (;;) {
      const { data: batch, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) {
        console.warn("listInboxRecipients failed:", error.message);
        break;
      }
      for (const u of batch.users ?? []) {
        options.push({ id: u.id, email: u.email ?? null });
      }
      if ((batch.users?.length ?? 0) < perPage) break;
      page += 1;
      if (page > 50) break;
    }
    return options.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
  });

/** Admin compose — one user or everyone. */
export const sendInboxMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SendSchema.parse(input))
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.accessToken);
    const title = data.title.replace(/[\r\n]+/g, " ").slice(0, 120);
    const body = data.body.replace(/\r\n/g, "\n").slice(0, 2000);
    const supabase = createServiceClient();

    let recipientIds: string[];
    let kind = data.kind ?? "promo";

    if (data.recipientUserId) {
      recipientIds = [data.recipientUserId];
      if (kind === "broadcast") kind = "direct";
    } else {
      recipientIds = await listAllUserIds(supabase);
      if (kind === "direct") kind = "broadcast";
    }

    if (!recipientIds.length) {
      throw new Error("No recipients found.");
    }

    const rows = recipientIds.map((recipient_user_id) => ({
      sender_user_id: admin.id,
      recipient_user_id,
      title,
      body,
      kind,
      read: false,
    }));

    const { error } = await supabase.from("inbox_messages").insert(rows);
    if (error) {
      console.error("sendInboxMessage failed:", error.message);
      throw new Error("Could not send message.");
    }

    // Alerts + push so recipients notice without opening Profile.
    const notifyRows = recipientIds.map((user_id) => ({
      user_id,
      watch_id: null as string | null,
      title,
      body: body.slice(0, 280),
      read: false,
    }));
    const { error: notifyErr } = await supabase.from("notifications").insert(notifyRows);
    if (notifyErr) {
      console.warn("Inbox alert insert failed:", notifyErr.message);
    }

    try {
      const { sendPushToUser } = await import("./push.server");
      await Promise.all(
        recipientIds.map((userId) =>
          sendPushToUser(userId, {
            title,
            body: body.slice(0, 120),
            url: "/profile",
          }).catch((err) => {
            console.warn("Inbox push failed:", err);
          }),
        ),
      );
    } catch (pushErr) {
      console.warn("Inbox push batch failed:", pushErr);
    }

    console.info(
      JSON.stringify({
        event: "inbox_send",
        adminId: admin.id,
        kind,
        recipients: recipientIds.length,
        at: new Date().toISOString(),
      }),
    );

    return { ok: true as const, sent: recipientIds.length };
  });

/** Badge for Profile tab: unread inbox messages only. */
export const getInboxBadgeCount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }): Promise<{ count: number }> => {
    const user = await requireUser(data.accessToken);
    const supabase = createServiceClient();

    const { count: unreadMessages, error: msgErr } = await supabase
      .from("inbox_messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_user_id", user.id)
      .eq("read", false);

    if (msgErr) {
      console.warn("getInboxBadgeCount messages failed:", msgErr.message);
      return { count: 0 };
    }

    return { count: unreadMessages ?? 0 };
  });

/** Admin: messages they sent recently. */
export const listSentInboxMessages = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }): Promise<InboxMessage[]> => {
    const admin = await requireAdmin(data.accessToken);
    const supabase = createServiceClient();
    const { data: rows, error } = await supabase
      .from("inbox_messages")
      .select("id, sender_user_id, recipient_user_id, title, body, kind, read, created_at")
      .eq("sender_user_id", admin.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("listSentInboxMessages failed:", error.message);
      throw new Error("Could not load sent messages.");
    }
    return (rows ?? []) as InboxMessage[];
  });
