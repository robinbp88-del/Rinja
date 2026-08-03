import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { requireAuth } from "../lib/requireAuth";
import {
  DIGEST_LABELS,
  getPreferences,
  setEmailDigest,
  type EmailDigest,
} from "../lib/preferences";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: SettingsPage,
});

const OPTIONS: { value: EmailDigest; description: string }[] = [
  {
    value: "daily",
    description: "One email per day with what changed (recommended).",
  },
  {
    value: "immediate",
    description: "Email every time a watch changes.",
  },
  {
    value: "none",
    description: "Stay in-app only — no emails.",
  },
];

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const prefsQuery = useQuery({
    queryKey: ["preferences"],
    queryFn: getPreferences,
  });

  const saveMutation = useMutation({
    mutationFn: (value: EmailDigest) => setEmailDigest(value),
    onSuccess: (data) => {
      queryClient.setQueryData(["preferences"], data);
    },
  });

  const current = prefsQuery.data?.email_digest ?? "daily";

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
          <Mail className="h-4 w-4" />
          <h2 className="text-[11px] uppercase tracking-widest">
            Email alerts
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          In-app alerts always work. Choose how often you want email.
        </p>

        {prefsQuery.isPending ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : prefsQuery.isError ? (
          <p className="mt-6 text-sm text-destructive">
            Couldn’t load settings. Run the preferences SQL in Supabase if you
            haven’t yet.
          </p>
        ) : (
          <div className="mt-5 space-y-2">
            {OPTIONS.map((option) => {
              const selected = current === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate(option.value)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                    selected
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {DIGEST_LABELS[option.value]}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  {saveMutation.isPending &&
                  saveMutation.variables === option.value ? (
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : selected ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {saveMutation.isError ? (
          <p className="mt-4 text-sm text-destructive">
            Couldn’t save. Check that migration 006 is applied in Supabase.
          </p>
        ) : null}

        {saveMutation.isSuccess ? (
          <p className="mt-4 text-sm text-muted-foreground">Saved.</p>
        ) : null}
      </section>
    </div>
  );
}
