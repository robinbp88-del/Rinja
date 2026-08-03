import { redirect } from "@tanstack/react-router";
import { supabase } from "./supabase";

/**
 * Guard authenticated routes.
 *
 * Session tokens live in the browser (localStorage). During SSR there is no
 * access to that storage, so we must NOT redirect on the server — otherwise
 * every cold open of the PWA looks "logged out".
 */
export async function requireAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect({ to: "/welcome" });
  }

  // Keep refresh tokens warm when possible (ignore transient network errors).
  void supabase.auth.getUser().catch(() => undefined);

  return session;
}
