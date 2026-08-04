import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Play, RefreshCw, Shield } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import { BottomNav } from "../components/BottomNav";
import { BetaBadge } from "../components/BetaChrome";
import { checkAdminAccess, getAdminStats, runAdminMonitorOnce } from "../lib/admin.functions";
import { requireAuth } from "../lib/requireAuth";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/admin")({
  beforeLoad: requireAuth,
  component: AdminPage,
});

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleString();
}

function AdminPage() {
  const navigate = useNavigate();
  const checkAccess = useServerFn(checkAdminAccess);
  const fetchStats = useServerFn(getAdminStats);
  const runMonitor = useServerFn(runAdminMonitorOnce);
  const [token, setToken] = useState<string | null>(null);
  const [runNote, setRunNote] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  const accessQuery = useQuery({
    queryKey: ["admin", "access", token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) return { admin: false };
      return checkAccess({ data: { accessToken: token } });
    },
  });

  const statsQuery = useQuery({
    queryKey: ["admin", "stats", token],
    enabled: Boolean(token) && accessQuery.data?.admin === true,
    queryFn: async () => {
      if (!token) throw new Error("No session");
      return fetchStats({ data: { accessToken: token } });
    },
    refetchInterval: 60_000,
  });

  const monitorMutation = useMutation({
    mutationFn: async (force: boolean) => {
      if (!token) throw new Error("No session");
      return runMonitor({ data: { accessToken: token, force } });
    },
    onSuccess: (result) => {
      setRunNote(
        `Checked ${result.checked} · changed ${result.changed} · errors ${result.errors} (${result.elapsedMs}ms)`,
      );
      void statsQuery.refetch();
    },
    onError: () => {
      setRunNote("Monitor run failed. Check server logs.");
    },
  });

  useEffect(() => {
    if (accessQuery.isLoading || !accessQuery.data) return;
    if (!accessQuery.data.admin) {
      void navigate({ to: "/home", replace: true });
    }
  }, [accessQuery.data, accessQuery.isLoading, navigate]);

  if (!token || accessQuery.isLoading || accessQuery.data?.admin !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="min-h-screen pb-32">
      <header className="flex items-center justify-between gap-3 px-4 pt-6 screen-safe">
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 text-primary">
              <Shield className="h-3.5 w-3.5" />
              <p className="text-[11px] uppercase tracking-widest">Admin</p>
              <BetaBadge />
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight">Backoffice</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void statsQuery.refetch()}
          disabled={statsQuery.isFetching}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card disabled:opacity-50"
          aria-label="Refresh stats"
        >
          <RefreshCw className={`h-4 w-4 ${statsQuery.isFetching ? "animate-spin" : ""}`} />
        </button>
      </header>

      <section className="mt-6 px-6">
        <p className="text-[13px] text-muted-foreground">
          Beta health overview. Active = opened the app recently. No page HTML or secrets are shown
          here.
        </p>
      </section>

      {statsQuery.isError ? (
        <div className="mx-6 mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
          Could not load stats. Try again.
        </div>
      ) : null}

      <section className="mt-5 px-6">
        <h2 className="text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
          Monitor health
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatCard label="Active watches" value={stats?.watchesActive ?? "—"} hint="Not paused" />
          <StatCard
            label="Unstable"
            value={stats?.watchesUnstable ?? "—"}
            hint="≥3 fails in a row"
          />
          <StatCard
            label="OK last 24h"
            value={stats?.checksOk24h ?? "—"}
            hint="Watches with success"
          />
          <StatCard
            label="Failing last 24h"
            value={stats?.checksFail24h ?? "—"}
            hint="Error / blocked"
          />
          <StatCard label="Alerts sent" value={stats?.alertsToday ?? "—"} hint="Today" />
          <StatCard
            label="Last cron-ish"
            value={
              stats?.lastAttemptedAt ? new Date(stats.lastAttemptedAt).toLocaleTimeString() : "—"
            }
            hint={formatWhen(stats?.lastAttemptedAt)}
          />
        </div>
        <div className="mt-3 space-y-1 rounded-2xl border border-border bg-card p-4 text-[12px] text-muted-foreground">
          <p>Last success: {formatWhen(stats?.lastSuccessAt)}</p>
          <p>Last error at: {formatWhen(stats?.lastErrorAt)}</p>
          <p className="break-words">Last error: {stats?.lastErrorSample ?? "—"}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={monitorMutation.isPending}
            onClick={() => monitorMutation.mutate(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[13px] disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            Run due checks
          </button>
          <button
            type="button"
            disabled={monitorMutation.isPending}
            onClick={() => monitorMutation.mutate(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[13px] disabled:opacity-50"
          >
            Force run (25)
          </button>
        </div>
        {runNote ? <p className="mt-2 text-[12px] text-muted-foreground">{runNote}</p> : null}
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 px-6">
        <StatCard label="Users" value={stats?.usersTotal ?? "—"} hint="Total accounts" />
        <StatCard label="Active 24h" value={stats?.active24h ?? "—"} hint="Opened app" />
        <StatCard label="Active 7d" value={stats?.active7d ?? "—"} hint="Opened app" />
        <StatCard label="Watches" value={stats?.watchesTotal ?? "—"} hint="All users" />
        <StatCard label="Alerts 7d" value={stats?.alerts7d ?? "—"} />
        <StatCard
          label="Lookups today"
          value={stats?.searchesToday ?? "—"}
          hint="URL field + Search"
        />
        <StatCard label="Lookups 7d" value={stats?.searches7d ?? "—"} />
        <StatCard label="Push subs" value={stats?.pushSubscriptions ?? "—"} hint="Devices" />
      </section>

      <BottomNav />
    </div>
  );
}
