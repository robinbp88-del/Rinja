import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { mintProxyTicket } from "./proxy-ticket";

const InputSchema = z.object({
  accessToken: z.string().min(20),
});

async function requireUserId(accessToken: string): Promise<string> {
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

/** Mint a short-lived proxy ticket for the signed-in user. */
export const createProxyTicket = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ ticket: string }> => {
    const userId = await requireUserId(data.accessToken);
    return { ticket: mintProxyTicket(userId) };
  });
