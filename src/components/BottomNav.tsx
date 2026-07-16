import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Bell, User } from "lucide-react";

const tabs = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md screen-safe">
      <div className="mx-4 mb-3 rounded-full border border-border bg-card/80 px-2 py-2 backdrop-blur-xl">
        <ul className="grid grid-cols-4">
          {tabs.map(({ to, icon: Icon, label }) => {
            const active = pathname === to;
            return (
              <li key={to} className="flex justify-center">
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-1.5 text-[10px] transition ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
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
