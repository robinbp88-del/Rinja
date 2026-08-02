import { redirect } from "@tanstack/react-router";
import { supabase } from "./supabase";

/** Redirect unauthenticated users to welcome. Use in route beforeLoad. */
export async function requireAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect({ to: "/welcome" });
  }

  return session;
}
