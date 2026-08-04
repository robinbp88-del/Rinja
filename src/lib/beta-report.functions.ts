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
    const userIds = [...new Set(reports.map((r) => r.user_id))];
    const emailById = new Map<string, string | null>();

    await Promise.all(
      userIds.map(async (id) => {
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(id);
          emailById.set(id, authData.user?.email ?? null);
        } catch {
          emailById.set(id, null);
        }
      }),
    );

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
