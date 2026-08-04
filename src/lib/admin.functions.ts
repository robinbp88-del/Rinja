import { createServerFn } from "@tanstack/react-start";
import { createClient, type User } from "@supabase/supabase-js";
import { z } from "zod";
import { isAdminUser } from "./admin";
import { createServiceClient } from "./supabase.server";

const TokenSchema = z.object({
  accessToken: z.string().min(20),
});

export type AdminStats = {
  usersTotal: number;
  active24h: number;
  active7d: number;
  watchesTotal: number;
  watchesActive: number;
  alertsToday: number;
  alerts7d: number;
  searchesToday: number;
  searches7d: number;
  pushSubscriptions: number;
  checksOk24h: number;
  checksFail24h: number;
  watchesUnstable: number;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorSample: string | null;
  lastAttemptedAt: string | null;
};

async function requireAdminFromToken(accessToken: string): Promise<User> {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase config");
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await userClient.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error("Unauthorized");
  }
  if (!isAdminUser(data.user)) {
    throw new Error("Forbidden");
  }
  return data.user;
}

async function countRows(table: string, sinceIso?: string): Promise<number> {
  const supabase = createServiceClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (sinceIso) {
    q = q.gte("created_at", sinceIso);
  }
  const { count, error } = await q;
  if (error) {
    console.warn(`Admin count ${table} failed:`, error.message);
    return 0;
  }
  return count ?? 0;
}

async function countActiveUsers(sinceIso: string): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("user_activity")
    .select("*", { count: "exact", head: true })
    .gte("last_seen_at", sinceIso);
  if (error) {
    console.warn("Admin active users failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

async function countAuthUsers(): Promise<number> {
  const supabase = createServiceClient();
  // listUsers is paginated; walk pages for a true total (fine for small beta).
  let total = 0;
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.warn("Admin listUsers failed:", error.message);
      break;
    }
    const batch = data.users?.length ?? 0;
    total += batch;
    if (batch < perPage) break;
    page += 1;
    if (page > 50) break;
  }
  return total;
}

export const checkAdminAccess = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }): Promise<{ admin: boolean }> => {
    try {
      await requireAdminFromToken(data.accessToken);
      return { admin: true };
    } catch {
      return { admin: false };
    }
  });

export const getAdminStats = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }): Promise<AdminStats> => {
    await requireAdminFromToken(data.accessToken);

    const now = Date.now();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayIso = startOfToday.toISOString();

    const supabase = createServiceClient();

    const [
      usersTotal,
      active24h,
      active7d,
      watchesTotal,
      alertsToday,
      alerts7d,
      searchesToday,
      searches7d,
      pushSubscriptions,
    ] = await Promise.all([
      countAuthUsers(),
      countActiveUsers(dayAgo),
      countActiveUsers(weekAgo),
      countRows("watches"),
      countRows("notifications", todayIso),
      countRows("notifications", weekAgo),
      countRows("search_events", todayIso),
      countRows("search_events", weekAgo),
      countRows("push_subscriptions"),
    ]);

    const [activeRes, okRes, failRes, unstableRes, lastSuccessRes, lastErrorRes, lastAttemptRes] =
      await Promise.all([
        supabase.from("watches").select("*", { count: "exact", head: true }).eq("paused", false),
        supabase
          .from("watches")
          .select("*", { count: "exact", head: true })
          .gte("last_success_at", dayAgo),
        supabase
          .from("watches")
          .select("*", { count: "exact", head: true })
          .gte("last_attempted_at", dayAgo)
          .in("check_status", ["error", "blocked", "unsupported"]),
        supabase
          .from("watches")
          .select("*", { count: "exact", head: true })
          .gte("consecutive_failures", 3),
        supabase
          .from("watches")
          .select("last_success_at")
          .not("last_success_at", "is", null)
          .order("last_success_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("watches")
          .select("last_error, last_attempted_at")
          .not("last_error", "is", null)
          .order("last_attempted_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("watches")
          .select("last_attempted_at")
          .not("last_attempted_at", "is", null)
          .order("last_attempted_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const lastErrorSample = lastErrorRes.data?.last_error
      ? String(lastErrorRes.data.last_error).slice(0, 160)
      : null;

    return {
      usersTotal,
      active24h,
      active7d,
      watchesTotal,
      watchesActive: activeRes.count ?? 0,
      alertsToday,
      alerts7d,
      searchesToday,
      searches7d,
      pushSubscriptions,
      checksOk24h: okRes.count ?? 0,
      checksFail24h: failRes.count ?? 0,
      watchesUnstable: unstableRes.count ?? 0,
      lastSuccessAt: lastSuccessRes.data?.last_success_at ?? null,
      lastErrorAt: lastErrorRes.data?.last_attempted_at ?? null,
      lastErrorSample,
      lastAttemptedAt: lastAttemptRes.data?.last_attempted_at ?? null,
    };
  });

/** Admin-only: run due watch checks once (optional force). */
export const runAdminMonitorOnce = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        accessToken: z.string().min(20),
        force: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminFromToken(data.accessToken);
    const { runDueWatchChecks } = await import("./monitoring/engine");
    const started = Date.now();
    const summary = await runDueWatchChecks(25, {
      force: Boolean(data.force),
    });
    console.info(
      JSON.stringify({
        event: "admin_monitor_run",
        force: Boolean(data.force),
        elapsedMs: Date.now() - started,
        checked: summary.checked,
        changed: summary.changed,
        errors: summary.errors,
        at: new Date().toISOString(),
      }),
    );
    return {
      ok: true as const,
      force: Boolean(data.force),
      elapsedMs: Date.now() - started,
      checked: summary.checked,
      changed: summary.changed,
      errors: summary.errors,
      skipped: summary.skipped,
      baselines: summary.baselines,
    };
  });
