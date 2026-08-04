import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { checkWatchForUser, runDueWatchChecksForUser, type MonitorRunSummary } from "./engine";

const TokenSchema = z.object({
  accessToken: z.string().min(20),
});

const OneWatchSchema = TokenSchema.extend({
  watchId: z.string().uuid(),
});

async function userIdFromToken(accessToken: string): Promise<string> {
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

  return data.user.id;
}

/** Check this user's due watches (respects each watch frequency). */
export const checkMyDueWatches = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenSchema.parse(input))
  .handler(async ({ data }): Promise<MonitorRunSummary> => {
    const userId = await userIdFromToken(data.accessToken);
    return runDueWatchChecksForUser(userId, 10);
  });

/** Force-check one watch owned by the signed-in user. */
export const checkMyWatchNow = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => OneWatchSchema.parse(input))
  .handler(async ({ data }) => {
    const userId = await userIdFromToken(data.accessToken);
    return checkWatchForUser(userId, data.watchId);
  });
