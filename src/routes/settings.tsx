import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Loader2 } from "lucide-react";
import { requireAuth } from "../lib/requireAuth";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushPermission,
  hasActivePushSubscription,
  pushSupported,
} from "../lib/push-client";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const ok = pushSupported();
    setSupported(ok);
    void (async () => {
      setPermission(await getPushPermission());
      setEnabled(await hasActivePushSubscription());
    })();
  }, []);

  const togglePush = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (enabled) {
        const res = await disablePushNotifications();
        if (!res.ok) {
          setMessage(res.error ?? "Could not disable push.");
        } else {
          setEnabled(false);
          setMessage("Push alerts turned off.");
        }
      } else {
        const res = await enablePushNotifications();
        if (!res.ok) {
          setMessage(res.error ?? "Could not enable push.");
        } else {
          setEnabled(true);
          setPermission("granted");
          setMessage("Push alerts on — you’ll get system notifications.");
        }
      }
    } finally {
      setBusy(false);
      setPermission(await getPushPermission());
      setEnabled(await hasActivePushSubscription());
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="flex items-center gap-3 px-4 pt-6 screen-safe">
        <button
          type="button"
          onClick={() => navigate({ to: "/profile" })}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-xs text-muted-foreground">Profile</p>
          <h1 className="text-sm font-medium">Settings</h1>
        </div>
      </header>

      <section className="mt-8 px-6">
        <div className="flex items-center gap-2 text-primary">
          <Bell className="h-4 w-4" />
          <h2 className="text-[11px] uppercase tracking-widest">Alerts</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          In-app alerts always work. Turn on push for lock-screen notifications
          and a number on the home-screen icon (installed PWA). If the phone
          dies or you reinstall, turn push on again here.
        </p>

        <div className="mt-5 rounded-2xl border border-border bg-card px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Push notifications</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {!supported
                  ? "Install Rinja to your home screen first (best on Android Chrome)."
                  : enabled
                    ? "On — you’ll get system alerts when something changes."
                    : permission === "denied"
                      ? "Blocked in browser settings. Allow notifications for Rinja."
                      : "Off — tap to enable system alerts."}
              </p>
            </div>
            <button
              type="button"
              disabled={!supported || busy || permission === "denied"}
              onClick={() => void togglePush()}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                enabled ? "bg-primary" : "bg-muted"
              } disabled:opacity-40`}
              aria-pressed={enabled}
              aria-label="Toggle push notifications"
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  enabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {busy ? (
            <p className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </p>
          ) : null}

          {message ? (
            <p className="mt-3 text-[12px] text-muted-foreground">{message}</p>
          ) : null}
        </div>

        <div className="mt-3 rounded-2xl border border-border bg-card/50 px-4 py-3.5">
          <p className="text-sm font-medium">In-app Alerts</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Always available in the Alerts tab.
          </p>
          <Link
            to="/notifications"
            className="mt-3 inline-flex text-sm font-medium text-primary"
          >
            Go to Alerts →
          </Link>
        </div>
      </section>
    </div>
  );
}
