import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pause, Play, Trash2, Clock, Globe } from "lucide-react";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/watch/$id")({
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
  const { watches, togglePause, removeWatch } = useStore();
  const w = watches.find((x) => x.id === id);

  if (!w) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">This watch no longer exists.</p>
        <button onClick={() => navigate({ to: "/home" })} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="flex items-center gap-3 px-4 pt-6 screen-safe">
        <button onClick={() => navigate({ to: "/home" })} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{w.host}</p>
          <p className="truncate text-sm font-medium">{w.label}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${w.paused ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>
          {w.paused ? "Paused" : "Live"}
        </span>
      </header>

      <section className="mt-8 px-6 text-center">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Current value</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight">{w.currentValue}</p>
      </section>

      <section className="mt-8 px-6">
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          <InfoRow icon={Globe} label="Website" value={w.host} />
          <InfoRow icon={Clock} label="Frequency" value={FREQ_LABEL[w.frequency]} />
        </div>
      </section>

      <section className="mt-8 px-6">
        <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground">History</h3>
        <div className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">History will appear here after the first change.</p>
        </div>
      </section>

      <section className="mt-8 flex gap-2 px-6">
        <button
          onClick={() => togglePause(w.id)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-medium"
        >
          {w.paused ? <><Play className="h-4 w-4" /> Resume</> : <><Pause className="h-4 w-4" /> Pause</>}
        </button>
        <button
          onClick={() => { removeWatch(w.id); navigate({ to: "/home" }); }}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 py-3 text-sm font-medium text-destructive"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </section>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
