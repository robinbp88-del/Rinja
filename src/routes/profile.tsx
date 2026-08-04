import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronRight,
  Crown,
  Palette,
  Settings,
  Shield,
  FileText,
  LogOut,
  Loader2,
  Inbox,
} from "lucide-react";

import { BottomNav } from "../components/BottomNav";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  BetaBadge,
  BetaBanner,
  ReportProblemButton,
  useAccessToken,
} from "../components/BetaChrome";
import { useStore } from "../lib/store";
import { signOut } from "../lib/auth";
import { getWatches } from "../lib/watches";
import { toUserError } from "../lib/user-errors";
import { useAuth } from "../providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { requireAuth } from "../lib/requireAuth";
import { useServerFn } from "@tanstack/react-start";
import { checkAdminAccess } from "../lib/admin.functions";
import { getInboxUnreadCount } from "../lib/inbox.functions";
import { listAdminBetaReports, listMyBetaReports } from "../lib/beta-report.functions";

export const Route = createFileRoute("/profile")({
  beforeLoad: requireAuth,
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  const { logout: clearLocalStore } = useStore();

  const watchesQuery = useQuery({
    queryKey: ["watches", authUser?.id],
    queryFn: getWatches,
    enabled: Boolean(authUser),
  });

  const watchCount = watchesQuery.data?.length ?? 0;

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const token = useAccessToken();
  const checkAccess = useServerFn(checkAdminAccess);
  const unreadFn = useServerFn(getInboxUnreadCount);
  const listAdminReports = useServerFn(listAdminBetaReports);
  const listMyReports = useServerFn(listMyBetaReports);

  const adminQuery = useQuery({
    queryKey: ["admin", "access", token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) return { admin: false };
      return checkAccess({ data: { accessToken: token } });
    },
    staleTime: 5 * 60_000,
  });

  const unreadQuery = useQuery({
    queryKey: ["inbox", "unread", token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) return { count: 0 };
      return unreadFn({ data: { accessToken: token } });
    },
    refetchInterval: 60_000,
  });

  const openReportsQuery = useQuery({
    queryKey: ["beta-reports", "badge", token, adminQuery.data?.admin],
    enabled: Boolean(token) && adminQuery.data !== undefined,
    queryFn: async () => {
      if (!token) return 0;
      if (adminQuery.data?.admin) {
        const rows = await listAdminReports({ data: { accessToken: token } });
        return rows.filter((r) => r.status === "open").length;
      }
      const rows = await listMyReports({ data: { accessToken: token } });
      return rows.filter((r) => r.status === "replied" && r.admin_reply).length;
    },
  });

  const inboxBadge =
    (unreadQuery.data?.count ?? 0) + (adminQuery.data?.admin ? (openReportsQuery.data ?? 0) : 0);

  const displayName = authUser?.user_metadata?.name ?? authUser?.email?.split("@")[0] ?? "You";

  const email = authUser?.email ?? "Signed in";

  async function performLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      setLogoutError("");

      await signOut();
      clearLocalStore();
      queryClient.clear();
      setConfirmOpen(false);

      navigate({
        to: "/welcome",
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);

      setLogoutError(toUserError(error, "Could not log out. Please try again."));
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="px-6 pt-12 screen-safe">
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] font-semibold tracking-tight">Profile</h1>
          <BetaBadge />
        </div>
        <BetaBanner className="mt-2" />
      </header>

      <section className="mt-6 px-6">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50 text-lg font-semibold text-primary-foreground">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>

            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>

          <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
            {watchCount} watching
          </span>
        </div>
      </section>

      <section className="mt-6 px-6">
        <Link
          to="/premium"
          className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/20 to-transparent p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Crown className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold">Try Rinja Premium</p>

            <p className="text-xs text-muted-foreground">Unlimited watches. 7-day free trial.</p>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>

      <section className="mt-6 px-6">
        <Group>
          <Link
            to="/inbox"
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-accent"
          >
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">Inbox</span>
            {inboxBadge > 0 ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                {inboxBadge}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Messages</span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Row icon={Palette} label="Theme" hint="Dark" />
          <Link
            to="/settings"
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-accent"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">Settings</span>
            <span className="text-xs text-muted-foreground">Alerts</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/privacy"
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-accent"
          >
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">Privacy</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/terms"
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-accent"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">Terms</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </Group>
      </section>

      <section className="mt-6 px-6 space-y-3">
        <ReportProblemButton />
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-medium text-destructive transition active:scale-[0.99] disabled:opacity-60"
        >
          {loggingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging out…
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Log out
            </>
          )}
        </button>

        {logoutError && <p className="mt-3 text-center text-xs text-destructive">{logoutError}</p>}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Log out of Rinja?"
        description="You can sign back in anytime. Your watches stay saved."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        destructive
        busy={loggingOut}
        onConfirm={() => void performLogout()}
      />

      <BottomNav />
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {children}
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />

      <span className="flex-1 text-sm">{label}</span>

      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}

      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
