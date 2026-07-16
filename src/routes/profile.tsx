import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Crown, Palette, Settings, LifeBuoy, Shield, LogOut } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const { user, watches, logout } = useStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-32">
      <header className="px-6 pt-12 screen-safe">
        <h1 className="text-[28px] font-semibold tracking-tight">Profile</h1>
      </header>

      <section className="mt-6 px-6">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50 text-lg font-semibold text-primary-foreground">
            {(user?.name?.[0] ?? "Y").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? "You"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? "signed in"}</p>
          </div>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
            {watches.length} watching
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
            <p className="text-sm font-semibold">Try WatchPage Premium</p>
            <p className="text-xs text-muted-foreground">Unlimited watches. 7-day free trial.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>

      <section className="mt-6 px-6">
        <Group>
          <Row icon={Palette} label="Theme" hint="Dark" />
          <Row icon={Settings} label="Settings" />
          <Row icon={LifeBuoy} label="Support" />
          <Row icon={Shield} label="Privacy" />
        </Group>
      </section>

      <section className="mt-6 px-6">
        <button
          onClick={() => { logout(); navigate({ to: "/", replace: true }); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-medium text-destructive"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </section>

      <BottomNav />
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">{children}</div>;
}
function Row({ icon: Icon, label, hint }: { icon: any; label: string; hint?: string }) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-accent">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
