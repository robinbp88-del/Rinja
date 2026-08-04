import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createServiceClient } from "./supabase.server";

const ReportSchema = z.object({
  accessToken: z.string().min(20).optional(),
  message: z.string().trim().min(5).max(1000),
  path: z.string().max(200).optional(),
});

/** Store a short beta feedback note (no page HTML / secrets). */
export const submitBetaReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReportSchema.parse(input))
  .handler(async ({ data }) => {
    let userId: string | null = null;
    let email: string | null = null;

    if (data.accessToken) {
      const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && anonKey) {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: {
            headers: { Authorization: `Bearer ${data.accessToken}` },
          },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData } = await userClient.auth.getUser(data.accessToken);
        userId = userData.user?.id ?? null;
        email = userData.user?.email ?? null;
      }
    }

    const safeMessage = data.message.replace(/[\r\n]+/g, " ").slice(0, 1000);
    const safePath = (data.path ?? "").slice(0, 200);

    console.info(
      JSON.stringify({
        event: "beta_report",
        userId,
        email,
        path: safePath,
        message: safeMessage,
        at: new Date().toISOString(),
      }),
    );

    // Best-effort persist into search_events as a typed note (no HTML body).
    try {
      if (userId) {
        const supabase = createServiceClient();
        await supabase.from("search_events").insert({
          user_id: userId,
          query: `[beta-report] ${safePath}: ${safeMessage}`.slice(0, 500),
        });
      }
    } catch (error) {
      console.warn("beta_report persist failed:", error);
    }

    return { ok: true as const };
  });
