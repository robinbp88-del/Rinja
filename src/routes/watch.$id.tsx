import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  Pause,
  Play,
  Trash2,
  Clock,
  Globe,
  Loader2,
  RefreshCw,
  ExternalLink,
  Bell,
  BellOff,
  type LucideIcon,
} from "lucide-react";

import {
  deleteWatch,
  getWatchById,
  setWatchNotify,
  setWatchPaused,
} from "../lib/watches";
import { requireAuth } from "../lib/requireAuth";

export const Route = createFileRoute("/watch/$id")({
  beforeLoad: requireAuth,
  component: WatchDetail,
});

const FREQ_LABEL: Record<string, string> = {
  "5m": "Every 5 minutes",
  "15m": "Every 15 minutes",
  "1h": "Every hour",
  "6h": "Every 6 hours",
  "1d": "Every day",
};

function WatchDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const watchQuery = useQuery({
    queryKey: ["watch", id],
    queryFn: () => getWatchById(id),
  });

  const pauseMutation = useMutation({
    mutationFn: ({
      watchId,
      paused,
    }: {
      watchId: string;
      paused: boolean;
    }) => setWatchPaused(watchId, paused),

    onSuccess: async (updatedWatch) => {
      queryClient.setQueryData(
        ["watch", updatedWatch.id],
        updatedWatch,
      );

      await queryClient.invalidateQueries({
        queryKey: ["watches"],
      });
    },
  });

  const notifyMutation = useMutation({
    mutationFn: ({
      watchId,
      notify,
    }: {
      watchId: string;
      notify: boolean;
    }) => setWatchNotify(watchId, notify),

    onSuccess: async (updatedWatch) => {
      queryClient.setQueryData(
        ["watch", updatedWatch.id],
        updatedWatch,
      );

      await queryClient.invalidateQueries({
        queryKey: ["watches"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (watchId: string) => deleteWatch(watchId),

    onSuccess: async () => {
      queryClient.removeQueries({
        queryKey: ["watch", id],
      });

      await queryClient.invalidateQueries({
        queryKey: ["watches"],
      });

      navigate({
        to: "/home",
        replace: true,
      });
    },
  });

  if (watchQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading watch…
        </div>
      </div>
    );
  }

  if (watchQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium">
          I couldn't load this watch.
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          {watchQuery.error instanceof Error
            ? watchQuery.error.message
            : "Unknown error"}
        </p>

        <button
          type="button"
          onClick={() => watchQuery.refetch()}
          className="mt-5 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  const watch = watchQuery.data;

  if (!watch) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          This watch no longer exists.
        </p>

        <button
          type="button"
          onClick={() => navigate({ to: "/home" })}
          className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Home
        </button>
      </div>
    );
  }

  const frequency =
    FREQ_LABEL[watch.frequency ?? ""] ??
    watch.frequency ??
    "Not set";

  const currentValue =
    watch.current_value?.trim() || "No value yet";

  const alertsOn = watch.notify !== false;

  const handlePause = () => {
    if (pauseMutation.isPending) return;

    pauseMutation.mutate({
      watchId: watch.id,
      paused: !watch.paused,
    });
  };

  const handleNotify = () => {
    if (notifyMutation.isPending) return;

    notifyMutation.mutate({
      watchId: watch.id,
      notify: !alertsOn,
    });
  };

  const handleDelete = () => {
    if (deleteMutation.isPending) return;

    const confirmed = window.confirm(
      "Delete this watch permanently?",
    );

    if (confirmed) {
      deleteMutation.mutate(watch.id);
    }
  };

  const handleOpenWebsite = () => {
    navigate({
      to: "/highlight",
      search: {
        url: watch.url,
        selector: watch.selector ?? undefined,
        watchId: watch.id,
      } as never,
    });
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="flex items-center gap-3 px-4 pt-6 screen-safe">
        <button
          type="button"
          onClick={() => navigate({ to: "/home" })}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">
            {watch.host ?? "Website"}
          </p>

          <p className="truncate text-sm font-medium">
            {watch.label}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${
            watch.paused
              ? "bg-muted text-muted-foreground"
              : "bg-primary/15 text-primary"
          }`}
        >
          {watch.paused ? "Paused" : "Live"}
        </span>
      </header>

      <section className="mt-8 px-6 text-center">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Current value
        </p>

        <p className="mt-2 break-words text-4xl font-semibold tabular-nums tracking-tight">
          {currentValue}
        </p>
      </section>

      <section className="mt-8 px-6">
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          <InfoRow
            icon={Globe}
            label="Website"
            value={watch.host ?? watch.url}
          />

          <InfoRow
            icon={Clock}
            label="Frequency"
            value={frequency}
          />

          <InfoRow
            icon={alertsOn ? Bell : BellOff}
            label="Alerts"
            value={alertsOn ? "On" : "Off"}
          />
        </div>
      </section>

      <section className="mt-6 px-6">
        <button
          type="button"
          onClick={handleNotify}
          disabled={notifyMutation.isPending}
          className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-medium disabled:opacity-60"
        >
          {notifyMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : alertsOn ? (
            <>
              <BellOff className="h-4 w-4" />
              Turn alerts off
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Turn alerts on
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleOpenWebsite}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.98]"
        >
          <ExternalLink className="h-4 w-4" />
          Open Website
        </button>
      </section>

      <section className="mt-8 px-6">
        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground">
          History
        </h3>

        <div className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            History will appear here after the first change.
          </p>
        </div>
      </section>

      {(pauseMutation.isError || deleteMutation.isError) && (
        <section className="mt-5 px-6">
          <p className="text-center text-sm text-destructive">
            Something went wrong. Please try again.
          </p>
        </section>
      )}

      <section className="mt-8 flex gap-2 px-6">
        <button
          type="button"
          onClick={handlePause}
          disabled={pauseMutation.isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-medium disabled:opacity-60"
        >
          {pauseMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : watch.paused ? (
            <>
              <Play className="h-4 w-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 py-3 text-sm font-medium text-destructive disabled:opacity-60"
        >
          {deleteMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete
            </>
          )}
        </button>
      </section>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

      <span className="flex-1 text-sm text-muted-foreground">
        {label}
      </span>

      <span className="max-w-[55%] truncate text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}