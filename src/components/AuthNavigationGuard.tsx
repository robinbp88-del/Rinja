import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "./ConfirmDialog";
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (!AUTH_SCREENS.has(pathname)) return;
    if (confirmOpen || loggingOut) return;
    setConfirmOpen(true);
  }, [loading, user, pathname, confirmOpen, loggingOut]);

  const staySignedIn = () => {
    setConfirmOpen(false);
    void navigate({ to: "/home", replace: true });
  };

  const confirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      clearLocalStore();
      queryClient.clear();
      setConfirmOpen(false);
      void navigate({ to: "/welcome", replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      setConfirmOpen(false);
      void navigate({ to: "/home", replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={(open) => {
        if (!open) staySignedIn();
      }}
      title="Log out of Rinja?"
      description="You can sign back in anytime. Your watches stay saved."
      confirmLabel="Log out"
      cancelLabel="Stay signed in"
      destructive
      busy={loggingOut}
      onConfirm={() => void confirmLogout()}
    />
  );
}
