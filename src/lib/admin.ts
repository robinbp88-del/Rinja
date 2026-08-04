import type { User } from "@supabase/supabase-js";

/**
 * Comma-separated admin emails — server env only.
 * Do not use VITE_ADMIN_EMAILS (ships into the client bundle).
 */
export function adminEmailAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.app_metadata?.role === "admin") return true;
  const email = user.email?.trim().toLowerCase();
  if (!email) return false;
  return adminEmailAllowlist().includes(email);
}
