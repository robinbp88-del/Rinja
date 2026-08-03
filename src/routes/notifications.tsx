import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BottomNav } from "../components/BottomNav";
import { RinjaMascot } from "../components/RinjaMascot";
import {
  getNotifications,
  markAllNotificationsRead,
} from "../lib/notifications";
import { useAuth } from "../providers/AuthProvider";
import { requireAuth } from "../lib/requireAuth";

export const Route = createFileRoute("/notifications")({
  beforeLoad: requireAuth,
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: getNotifications,
    enabled: Boolean(user),
  });

  const notifications = notificationsQuery.data ?? [];
  const hasAlerts = notifications.length > 0;

  useEffect(() => {
    if (!user || notifications.length === 0) return;

    markAllNotificationsRead()
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .catch(console.error);
  }, [user, notifications.length, queryClient]);

  return (
    <div className="min-h-screen pb-32">
      <header className="flex items-baseline justify-between px-6 pt-12 screen-safe">
        <h1 className="text-[28px] font-semibold tracking-tight">Alerts</h1>
      </header>

      <section className="mt-4 flex flex-col items-center px-6 text-center">
        <RinjaMascot
          variant={hasAlerts ? "notify" : "relax"}
          mood={hasAlerts ? "alert" : "sleepy"}
          size={180}
        />
        <p className="mt-2 text-[14px] font-medium animate-fade-in">
          {hasAlerts
            ? "Something changed — take a look."
            : "Everything looks quiet."}
        </p>
      </section>

      <div className="mt-6 px-6">
        {hasAlerts ? (
          <div className="space-y-2">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.body}
                </p>
                {item.watch_id && (
                  <Link
                    to="/watch/$id"
                    params={{ id: item.watch_id }}
                    className="mt-3 inline-flex text-[11px] font-medium text-primary"
                  >
                    View watch →
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card/40 p-6 text-center">
            <p className="text-[14px] font-medium">No alerts yet</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              When something you watch changes, it shows up here. Start by
              adding a URL and highlighting a price or text.
            </p>
            <Link
              to="/add"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Add a watch
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
