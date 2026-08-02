import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Crown } from "lucide-react";
import { toast } from "sonner";
import { requireAuth } from "../lib/requireAuth";

export const Route = createFileRoute("/premium")({
  beforeLoad: requireAuth,
  component: Premium,
});

const FEATURES = [
  "Unlimited watches",
  "1-minute check frequency",
  "Priority push notifications",
  "Change history & diffs",
];

function Premium() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col px-6 pt-6 screen-safe">
      <button
        onClick={() => navigate({ to: "/profile" })}
        className="mb-8 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/50 shadow-xl">
          <Crown className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">WatchPage Premium</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Watch more. Watch faster. Never miss a moment.
        </p>
      </div>

      <ul className="mt-10 space-y-3">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </div>
            <span className="text-sm">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2 pb-8">
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center">
          <p className="text-xs uppercase tracking-widest text-primary">7 days free</p>
          <p className="mt-1 text-sm text-muted-foreground">Then $4.99 / month. Cancel anytime.</p>
        </div>
        <button
          onClick={() => toast.info("Payments arrive with the backend.")}
          className="flex h-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
        >
          Start free trial
        </button>
      </div>
    </div>
  );
}
