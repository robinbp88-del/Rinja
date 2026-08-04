import { createServerFn } from "@tanstack/react-start";
import { createClient, type User } from "@supabase/supabase-js";
import { z } from "zod";
import { isAdminUser } from "./admin";
import { createServiceClient } from "./supabase.server";

const TokenSchema = z.object({
  accessToken: z.string().min(20),
});

const ReportSchema = z.object({
  accessToken: z.string().min(20).optional(),
  message: z.string().trim().min(5).max(1000),
  path: z.string().max(200).optional(),
});

const ReplySchema = z.object({
  accessToken: z.string().min(20),
  reportId: z.string().uuid(),
  reply: z.string().trim().min(2).max(2000),
});

export type BetaReport = {
  id: string;
  user_id: string;
  message: string;
  path: string | null;
  status: "open" | "replied" | "closed" | string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  user_email?: string | null;
};

async function userClientFromToken(accessToken: string) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase config");
  }
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireUser(accessToken: string): Promise<User> {
  const client = await userClientFromToken(accessToken);
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

async function requireAdmin(accessToken: string): Promise<User> {
  const user = await requireUser(accessToken);
  if (!isAdminUser(user)) throw new Error("Forbidden");
  return user;
}

/** Store a short beta feedback note (no page HTML / secrets). */
export const submitBetaReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReportSchema.parse(input))
  .handler(async ({ data }) => {
    if (!data.accessToken) {
      throw new Error("Please sign in again.");
    }

    const user = await requireUser(data.accessToken);
    const safeMessage = data.message.replace(/[\r\n]+/g, " ").slice(0, 1000);
    const safePath = (data.path ?? "").slice(0, 200) || null;

    console.info(
      JSON.stringify({
        event: "beta_report",
        userId: user.id,
        email: user.email ?? null,
        path: safePath,
        message: safeMessage,
        at: new Date().toISOString(),
      }),
    );

    const supabase = createServiceClient();
    const { data: row, error } = await supabase
      .from("beta_reports")
      .insert({
        user_id: user.id,
        message: safeMessage,
        path: safePath,
        status: "open",
      })
      .select("id")
      .single();

    if (error) {
      console.error("beta_report insert failed:", error.message);
      throw new Error("Could not send report. Please try again.");
    }

    return { ok: true as const, id: row.id as string };
  });

/** Reports the signed-in user filed (incl. admin replies). */
export const listMyBetaReports = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }): Promise<BetaReport[]> => {
    const user = await requireUser(data.accessToken);
    const supabase = createServiceClient();
    const { data: rows, error } = await supabase
      .from("beta_reports")
      .select("id, user_id, message, path, status, admin_reply, replied_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("listMyBetaReports failed:", error.message);
      throw new Error("Could not load reports.");
    }

    return (rows ?? []) as BetaReport[];
  });

/** Admin inbox — all reports. */
export const listAdminBetaReports = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }): Promise<BetaReport[]> => {
    await requireAdmin(data.accessToken);
    const supabase = createServiceClient();
    const { data: rows, error } = await supabase
      .from("beta_reports")
      .select("id, user_id, message, path, status, admin_reply, replied_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("listAdminBetaReports failed:", error.message);
      throw new Error("Could not load inbox.");
    }

    const reports = (rows ?? []) as BetaReport[];
    const needed = new Set(reports.map((r) => r.user_id));
    const emailById = new Map<string, string | null>();

    // One paginated listUsers pass instead of N getUserById round-trips.
    let page = 1;
    const perPage = 200;
    for (;;) {
      const { data: batch, error: listErr } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      if (listErr) {
        console.warn("listUsers for reports failed:", listErr.message);
        break;
      }
      for (const u of batch.users ?? []) {
        if (needed.has(u.id)) emailById.set(u.id, u.email ?? null);
      }
      if (emailById.size >= needed.size) break;
      if ((batch.users?.length ?? 0) < perPage) break;
      page += 1;
      if (page > 20) break;
    }

    return reports.map((r) => ({
      ...r,
      user_email: emailById.get(r.user_id) ?? null,
    }));
  });

/** Admin reply — visible to the reporter on their profile. */
export const replyToBetaReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReplySchema.parse(input))
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.accessToken);
    const reply = data.reply.replace(/[\r\n]+/g, " ").slice(0, 2000);
    const supabase = createServiceClient();

    const { data: report, error: loadErr } = await supabase
      .from("beta_reports")
      .select("id, user_id, message")
      .eq("id", data.reportId)
      .maybeSingle();

    if (loadErr || !report) {
      throw new Error("Could not find that report.");
    }

    const { error } = await supabase
      .from("beta_reports")
      .update({
        admin_reply: reply,
        status: "replied",
        replied_at: new Date().toISOString(),
        replied_by: admin.id,
      })
      .eq("id", data.reportId);

    if (error) {
      console.error("replyToBetaReport failed:", error.message);
      throw new Error("Could not send reply.");
    }

    // Also land in Alerts + push so the user notices.
    try {
      await supabase.from("notifications").insert({
        user_id: report.user_id,
        watch_id: null,
        title: "Reply in Inbox",
        body: reply.slice(0, 280),
        read: false,
      });
    } catch (notifyErr) {
      console.warn("Reply notification insert failed:", notifyErr);
    }

    try {
      const { sendPushToUser } = await import("./push.server");
      await sendPushToUser(report.user_id, {
        title: "Reply in Inbox",
        body: reply.slice(0, 120),
        url: "/profile",
      });
    } catch (pushErr) {
      console.warn("Reply push failed:", pushErr);
    }

    console.info(
      JSON.stringify({
        event: "beta_report_reply",
        reportId: data.reportId,
        adminId: admin.id,
        at: new Date().toISOString(),
      }),
    );

    return { ok: true as const };
  });

const DismissReportSchema = z.object({
  accessToken: z.string().min(20),
  reportId: z.string().uuid(),
});

/** Admin: mark a report as seen/closed without a reply. */
export const dismissBetaReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DismissReportSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("beta_reports")
      .update({ status: "closed" })
      .eq("id", data.reportId)
      .eq("status", "open");

    if (error) {
      console.error("dismissBetaReport failed:", error.message);
      throw new Error("Could not mark report as seen.");
    }
    return { ok: true as const };
  });
