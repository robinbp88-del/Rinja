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
  alertsToday: number;
  alerts7d: number;
  searchesToday: number;
  searches7d: number;
  pushSubscriptions: number;
};

async function requireAdminFromToken(accessToken: string): Promise<User> {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
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

async function countRows(
  table: string,
  sinceIso?: string,
): Promise<number> {
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

    return {
      usersTotal,
      active24h,
      active7d,
      watchesTotal,
      alertsToday,
      alerts7d,
      searchesToday,
      searches7d,
      pushSubscriptions,
    };
  });
