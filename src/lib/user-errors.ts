import { AuthError } from "@supabase/supabase-js";

/**
 * Map technical errors to short, safe messages for the UI.
 * Never forward raw Supabase / fetch / Postgres text to users.
 */
export function toUserError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof AuthError) {
    return mapAuthMessage(error.message);
  }

  if (error && typeof error === "object" && "message" in error) {
    const msg = String((error as { message: unknown }).message ?? "");
    const mapped = mapKnownMessage(msg);
    if (mapped) return mapped;
  }

  if (error instanceof Error) {
    const mapped = mapKnownMessage(error.message);
    if (mapped) return mapped;
    // Already-sanitized app messages (short, no sql/http noise).
    if (error.message.length <= 120 && !looksTechnical(error.message)) {
      return error.message;
    }
  }

  return fallback;
}

function looksTechnical(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("supabase") ||
    m.includes("postgres") ||
    m.includes("pgrst") ||
    m.includes("jwt") ||
    m.includes("stack") ||
    m.includes("ecode") ||
    m.includes("violates") ||
    m.includes("permission denied") ||
    m.includes("row-level security") ||
    /https?:\/\//.test(m) ||
    m.includes("fetch failed") ||
    m.includes("networkerror")
  );
}

function mapAuthMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "Wrong email or password.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirm your email, then try again.";
  }
  if (m.includes("user already registered")) {
    return "That email is already registered. Sign in instead.";
  }
  if (m.includes("password") && m.includes("least")) {
    return "Password is too short.";
  }
  if (m.includes("rate") || m.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Network problem. Check your connection and try again.";
  }
  return "Could not sign in. Please try again.";
}

function mapKnownMessage(message: string): string | null {
  const m = message.toLowerCase();
  if (!message.trim()) return null;

  if (m.includes("must be signed in") || m.includes("unauthorized")) {
    return "Please sign in again.";
  }
  if (m.includes("forbidden")) {
    return "You don’t have access to that.";
  }
  if (m.includes("row-level security") || m.includes("rls")) {
    return "Could not save. Please sign in again.";
  }
  if (m.includes("duplicate") || m.includes("unique")) {
    return "That item already exists.";
  }
  if (m.includes("jwt") || m.includes("session")) {
    return "Your session expired. Please sign in again.";
  }
  if (m.includes("network") || m.includes("failed to fetch")) {
    return "Network problem. Check your connection and try again.";
  }
  if (looksTechnical(message)) {
    return "Something went wrong. Please try again.";
  }
  return null;
}
