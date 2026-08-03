import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "../lib/auth";
import { useStore } from "../lib/store";
import { useAuth } from "../providers/AuthProvider";

const AUTH_SCREENS = new Set(["/", "/welcome", "/login"]);

/**
 * Phone back often walks into welcome/login and feels like a logout.
 * Keep the session, and only leave after an explicit confirm.
 */
export function AuthNavigationGuard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout: clearLocalStore } = useStore();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  // Signed-in users should not remain on splash/welcome/login.
  useEffect(() => {
    if (loading || !user) return;
    if (!AUTH_SCREENS.has(pathname)) return;

    const leave = window.confirm("Log out of Rinja?");
    if (leave) {
      void (async () => {
        try {
          await signOut();
          clearLocalStore();
          queryClient.clear();
        } catch (error) {
          console.error("Logout failed:", error);
        } finally {
          void navigate({ to: "/welcome", replace: true });
        }
      })();
      return;
    }

    void navigate({ to: "/home", replace: true });
  }, [loading, user, pathname, navigate, clearLocalStore, queryClient]);

  return null;
}
