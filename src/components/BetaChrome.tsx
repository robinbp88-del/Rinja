import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquareWarning, X } from "lucide-react";
import { submitBetaReport } from "../lib/beta-report.functions";
import { supabase } from "../lib/supabase";

/** Discrete private-beta marker for authenticated shells. */
export function BetaBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground ${className}`}
    >
      Beta
    </span>
  );
}

export function BetaBanner({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[12px] leading-relaxed text-muted-foreground ${className}`}>
      Private beta — watching can miss JavaScript-heavy pages. Thanks for testing with us.
    </p>
  );
}

export function ReportProblemButton() {
  const report = useServerFn(submitBetaReport);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (busy || message.trim().length < 5) return;
    setBusy(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await report({
        data: {
          accessToken: session?.access_token,
          message: message.trim(),
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
        },
      });
      setDone(true);
      setMessage("");
    } catch (err) {
      console.error("Beta report failed:", err);
      setError("Could not send. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setDone(false);
          setError("");
        }}
        className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 text-left"
      >
        <span className="flex items-center gap-3 text-sm">
          <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
          Report a problem
        </span>
        <span className="text-[11px] text-muted-foreground">Beta</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Report a problem</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              Short note is enough — what page, what happened. No passwords.
            </p>
            {done ? (
              <p className="mt-4 text-sm text-primary">Thanks — we got it.</p>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Describe the issue…"
                  className="mt-3 w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
                {error ? <p className="mt-2 text-[12px] text-destructive">{error}</p> : null}
                <button
                  type="button"
                  disabled={busy || message.trim().length < 5}
                  onClick={() => void send()}
                  className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Send"}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
