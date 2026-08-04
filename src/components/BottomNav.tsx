import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Home, Search, Bell, User, Shield } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { syncAppBadge } from "../lib/app-badge";
import { checkAdminAccess } from "../lib/admin.functions";
import { getInboxBadgeCount } from "../lib/inbox.functions";
import { getUnreadNotificationCount } from "../lib/notifications";
import { useAuth } from "../providers/AuthProvider";
import { supabase } from "../lib/supabase";

const baseTabs = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const checkAccess = useServerFn(checkAdminAccess);
  const badgeFn = useServerFn(getInboxBadgeCount);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setToken(null);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, [user]);

  const adminQuery = useQuery({
    queryKey: ["admin", "access", token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) return { admin: false };
      return checkAccess({ data: { accessToken: token } });
    },
    staleTime: 5 * 60_000,
  });

  const isAdmin = adminQuery.data?.admin === true;

  const tabs = useMemo(
    () =>
      isAdmin
        ? [
            ...baseTabs.slice(0, 3),
            { to: "/admin" as const, icon: Shield, label: "Admin" },
            baseTabs[3],
          ]
        : [...baseTabs],
    [isAdmin],
  );

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread", user?.id],
    queryFn: getUnreadNotificationCount,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  const inboxBadgeQuery = useQuery({
    queryKey: ["inbox", "badge", token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) return { count: 0 };
      return badgeFn({ data: { accessToken: token } });
    },
    refetchInterval: 60_000,
  });

  const unread = unreadQuery.data ?? 0;
  const inboxBadge = inboxBadgeQuery.data?.count ?? 0;

  // Home-screen icon badge = same number as Alerts tab (single source: unread).
  useEffect(() => {
    if (!user || unreadQuery.isLoading) return;
    void syncAppBadge(unread);
  }, [user, unread, unreadQuery.isLoading]);

  useEffect(() => {
    if (!user) return;

    const sync = () => {
      void unreadQuery.refetch().then((result) => {
        const count = result.data ?? 0;
        void syncAppBadge(count);
      });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };

    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, unreadQuery]);

  const cols = tabs.length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md screen-safe">
      <div className="mx-4 mb-3 rounded-full border border-border bg-card/80 px-2 py-2 backdrop-blur-xl">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {tabs.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || (to === "/admin" && pathname.startsWith("/admin"));
            const showAlertsBadge = to === "/notifications" && unread > 0;
            const showInboxBadge = to === "/profile" && inboxBadge > 0;
            const showBadge = showAlertsBadge || showInboxBadge;
            const badgeCount = showInboxBadge ? inboxBadge : unread;

            return (
              <li key={to} className="flex justify-center">
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] transition ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span className="relative">
                    <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
                    {showBadge && (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground shadow-sm shadow-black/30">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </span>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
