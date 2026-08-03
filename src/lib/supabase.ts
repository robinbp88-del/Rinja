import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

/**
 * Browser Supabase client — keep the session in localStorage so the PWA
 * stays signed in across closes/reopens.
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage:
      typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "rinja.auth",
  },
});
