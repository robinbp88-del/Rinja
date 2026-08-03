import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";
import { requireAuth } from "../lib/requireAuth";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();

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
          Changes show up in Alerts inside the app. Email is not enabled yet.
        </p>

        <div className="mt-5 rounded-2xl border border-border bg-card px-4 py-3.5">
          <p className="text-sm font-medium">In-app only</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Open Alerts anytime to see what changed on your watches.
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
