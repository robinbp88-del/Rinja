import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, Bell, User } from "lucide-react";
import { getUnreadNotificationCount } from "../lib/notifications";
import { useAuth } from "../providers/AuthProvider";

const tabs = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread", user?.id],
    queryFn: getUnreadNotificationCount,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  const unread = unreadQuery.data ?? 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md screen-safe">
      <div className="mx-4 mb-3 rounded-full border border-border bg-card/80 px-2 py-2 backdrop-blur-xl">
        <ul className="grid grid-cols-4">
          {tabs.map(({ to, icon: Icon, label }) => {
            const active = pathname === to;
            const showBadge = to === "/notifications" && unread > 0;

            return (
              <li key={to} className="flex justify-center">
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-1.5 text-[10px] transition ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span className="relative">
                    <Icon
                      className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`}
                    />
                    {showBadge && (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground shadow-sm shadow-black/30">
                        {unread > 99 ? "99+" : unread}
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
