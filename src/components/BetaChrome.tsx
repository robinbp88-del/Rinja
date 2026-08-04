import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Inbox, MessageSquareWarning, X } from "lucide-react";
import {
  listAdminBetaReports,
  listMyBetaReports,
  replyToBetaReport,
  submitBetaReport,
  type BetaReport,
} from "../lib/beta-report.functions";
import { checkAdminAccess } from "../lib/admin.functions";
import { supabase } from "../lib/supabase";

function useAccessToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);
  return token;
}

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.max(1, Math.round((Date.now() - t) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

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
  const queryClient = useQueryClient();
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
      if (!session?.access_token) {
        setError("Please sign in again.");
        return;
      }
      await report({
        data: {
          accessToken: session.access_token,
          message: message.trim(),
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
        },
      });
      setDone(true);
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["beta-reports"] });
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
              Short note is enough — what page, what happened. No passwords. You’ll see replies here
              on Profile.
            </p>
            {done ? (
              <p className="mt-4 text-sm text-primary">
                Thanks — we got it. Check Profile for a reply.
              </p>
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

function ReportCard({
  report,
  showEmail,
  adminReplyUi,
}: {
  report: BetaReport;
  showEmail?: boolean;
  adminReplyUi?: boolean;
}) {
  const queryClient = useQueryClient();
  const replyFn = useServerFn(replyToBetaReport);
  const token = useAccessToken();
  const [reply, setReply] = useState(report.admin_reply ?? "");
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No session");
      return replyFn({
        data: {
          accessToken: token,
          reportId: report.id,
          reply: reply.trim(),
        },
      });
    },
    onSuccess: () => {
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["beta-reports"] });
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {showEmail ? (
            <p className="truncate text-[11px] text-muted-foreground">
              {report.user_email ?? "Unknown user"}
              {report.path ? ` · ${report.path}` : ""}
            </p>
          ) : report.path ? (
            <p className="text-[11px] text-muted-foreground">{report.path}</p>
          ) : null}
          <p className="mt-1 text-sm leading-snug">{report.message}</p>
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {timeAgo(report.created_at)}
        </span>
      </div>

      {report.admin_reply ? (
        <div className="mt-3 rounded-xl bg-primary/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-primary">Reply from Rinja</p>
          <p className="mt-1 text-[13px] leading-snug">{report.admin_reply}</p>
        </div>
      ) : null}

      {adminReplyUi ? (
        <div className="mt-3">
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-[12px] font-medium text-primary"
            >
              {report.admin_reply ? "Edit reply" : "Reply"}
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Write a short reply…"
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={mutation.isPending || reply.trim().length < 2}
                  onClick={() => mutation.mutate()}
                  className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground disabled:opacity-50"
                >
                  {mutation.isPending ? "Sending…" : "Send reply"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
              {mutation.isError ? (
                <p className="text-[12px] text-destructive">Could not send reply.</p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Admin inbox on Profile — all beta reports + reply. */
export function AdminBetaInbox() {
  const token = useAccessToken();
  const checkAccess = useServerFn(checkAdminAccess);
  const listInbox = useServerFn(listAdminBetaReports);

  const accessQuery = useQuery({
    queryKey: ["admin", "access", token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) return { admin: false };
      return checkAccess({ data: { accessToken: token } });
    },
    staleTime: 5 * 60_000,
  });

  const inboxQuery = useQuery({
    queryKey: ["beta-reports", "admin", token],
    enabled: Boolean(token) && accessQuery.data?.admin === true,
    queryFn: async () => {
      if (!token) return [];
      return listInbox({ data: { accessToken: token } });
    },
    refetchInterval: 60_000,
  });

  if (accessQuery.data?.admin !== true) return null;

  const openCount = inboxQuery.data?.filter((r) => r.status === "open").length ?? 0;

  return (
    <section className="mt-6 px-6">
      <div className="mb-3 flex items-center gap-2">
        <Inbox className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Inbox</h2>
        {openCount > 0 ? (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
            {openCount} open
          </span>
        ) : null}
      </div>
      {inboxQuery.isLoading ? (
        <p className="text-[13px] text-muted-foreground">Loading inbox…</p>
      ) : inboxQuery.isError ? (
        <p className="text-[13px] text-destructive">
          Could not load inbox. Apply migration 010 if missing.
        </p>
      ) : !inboxQuery.data?.length ? (
        <p className="rounded-2xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
          No reports yet.
        </p>
      ) : (
        <div className="space-y-2">
          {inboxQuery.data.map((report) => (
            <ReportCard key={report.id} report={report} showEmail adminReplyUi />
          ))}
        </div>
      )}
    </section>
  );
}

/** Any user: their own reports + replies from you. */
export function MyBetaReports() {
  const token = useAccessToken();
  const listMine = useServerFn(listMyBetaReports);

  const myQuery = useQuery({
    queryKey: ["beta-reports", "mine", token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) return [];
      return listMine({ data: { accessToken: token } });
    },
  });

  if (myQuery.isLoading || !myQuery.data?.length) return null;

  return (
    <section className="mt-6 px-6">
      <h2 className="mb-3 text-sm font-semibold">Your reports</h2>
      <div className="space-y-2">
        {myQuery.data.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </section>
  );
}
