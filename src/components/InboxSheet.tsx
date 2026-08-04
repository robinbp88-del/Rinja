import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Inbox, Loader2, Send, X } from "lucide-react";

import { timeAgoLabel, useAccessToken } from "./BetaChrome";
import { checkAdminAccess } from "../lib/admin.functions";
import {
  dismissBetaReport,
  listAdminBetaReports,
  listMyBetaReports,
  replyToBetaReport,
  type BetaReport,
} from "../lib/beta-report.functions";
import {
  listInboxRecipients,
  listMyInboxMessages,
  markInboxMessageRead,
  markInboxMessagesRead,
  sendInboxMessage,
  type InboxMessage,
} from "../lib/inbox.functions";

function refreshInboxBadges(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["inbox"] });
  void queryClient.invalidateQueries({ queryKey: ["notifications"] });
}
function SectionSpinner() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
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
      refreshInboxBadges(queryClient);
    },
  });

  const dismissFn = useServerFn(dismissBetaReport);
  const dismissMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No session");
      return dismissFn({
        data: { accessToken: token, reportId: report.id },
      });
    },
    onSuccess: () => {
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
          {report.status === "open" && adminReplyUi ? (
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-primary">
              Open
            </p>
          ) : null}
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {timeAgoLabel(report.created_at)}
        </span>
      </div>

      {report.admin_reply ? (
        <div className="mt-3 rounded-xl bg-primary/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-primary">
            Reply from Rinja
          </p>
          <p className="mt-1 text-[13px] leading-snug">{report.admin_reply}</p>
        </div>
      ) : null}

      {adminReplyUi ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-[12px] font-medium text-primary"
            >
              {report.admin_reply ? "Edit reply" : "Reply"}
            </button>
          ) : null}
          {report.status === "open" ? (
            <button
              type="button"
              disabled={dismissMutation.isPending}
              onClick={() => dismissMutation.mutate()}
              className="text-[12px] text-muted-foreground"
            >
              Mark as seen
            </button>
          ) : null}
        </div>
      ) : null}

      {adminReplyUi && open ? (
        <div className="mt-3 space-y-2">
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
                <p className="text-[12px] text-destructive">
                  Could not send reply.
                </p>
              ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MessageCard({ message }: { message: InboxMessage }) {
  const token = useAccessToken();
  const queryClient = useQueryClient();
  const markOne = useServerFn(markInboxMessageRead);
  const [expanded, setExpanded] = useState(false);
  const [isRead, setIsRead] = useState(message.read);

  useEffect(() => {
    setIsRead(message.read);
  }, [message.read]);

  const markMutation = useMutation({
    mutationFn: async () => {
      if (!token || isRead) return;
      return markOne({
        data: { accessToken: token, messageId: message.id },
      });
    },
    onSuccess: () => {
      setIsRead(true);
      void queryClient.setQueryData(
        ["inbox", "messages", token],
        (old: InboxMessage[] | undefined) =>
          old?.map((m) =>
            m.id === message.id ? { ...m, read: true } : m,
          ),
      );
      refreshInboxBadges(queryClient);
    },
  });

  function openMessage() {
    setExpanded(true);
    if (!isRead) markMutation.mutate();
  }

  return (
    <button
      type="button"
      onClick={openMessage}
      className={`w-full rounded-2xl border bg-card p-4 text-left transition ${
        isRead ? "border-border" : "border-primary/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-primary">
            {message.kind === "promo"
              ? "From Rinja"
              : message.kind === "broadcast"
                ? "Announcement"
                : "Message"}
            {!isRead ? " · New" : ""}
          </p>
          <p className="mt-1 text-sm font-medium">{message.title}</p>
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {timeAgoLabel(message.created_at)}
        </span>
      </div>
      {expanded ? (
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-snug text-muted-foreground">
          {message.body}
        </p>
      ) : (
        <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">
          {message.body}
        </p>
      )}
      {!expanded ? (
        <p className="mt-1 text-[11px] text-primary">Tap to open</p>
      ) : null}
    </button>
  );
}
function ComposePanel({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const sendFn = useServerFn(sendInboxMessage);
  const listRecipients = useServerFn(listInboxRecipients);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [note, setNote] = useState("");
  const [loadPeople, setLoadPeople] = useState(false);

  const recipientsQuery = useQuery({
    queryKey: ["inbox", "recipients", token],
    enabled: loadPeople,
    queryFn: () => listRecipients({ data: { accessToken: token } }),
  });

  const sendMutation = useMutation({
    mutationFn: async () =>
      sendFn({
        data: {
          accessToken: token,
          title: title.trim(),
          body: body.trim(),
          recipientUserId: recipient === "all" ? null : recipient,
          kind: recipient === "all" ? "promo" : "direct",
        },
      }),
    onSuccess: (result) => {
      setNote(`Sent to ${result.sent} user${result.sent === 1 ? "" : "s"}.`);
      setTitle("");
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["inbox"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => setNote("Could not send. Try again."),
  });

  return (
    <section className="rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Send message</h2>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Promo or note to one tester — or everyone in the beta.
      </p>

      <label className="mt-3 block text-[11px] uppercase tracking-wider text-muted-foreground">
        To
      </label>
      <select
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        onFocus={() => setLoadPeople(true)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
      >
        <option value="all">Everyone</option>
        {recipientsQuery.isLoading && loadPeople ? <option disabled>Loading users…</option> : null}
        {(recipientsQuery.data ?? []).map((u) => (
          <option key={u.id} value={u.id}>
            {u.email ?? u.id.slice(0, 8)}
          </option>
        ))}
      </select>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Title"
        className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Message body…"
        className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
      <button
        type="button"
        disabled={sendMutation.isPending || title.trim().length < 2 || body.trim().length < 2}
        onClick={() => sendMutation.mutate()}
        className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {sendMutation.isPending ? "Sending…" : "Send"}
      </button>
      {note ? <p className="mt-2 text-[12px] text-muted-foreground">{note}</p> : null}
    </section>
  );
}

function InboxBody({ active }: { active: boolean }) {
  const token = useAccessToken();
  const queryClient = useQueryClient();
  const checkAccess = useServerFn(checkAdminAccess);
  const listAdminReports = useServerFn(listAdminBetaReports);
  const listMyReports = useServerFn(listMyBetaReports);
  const listMessages = useServerFn(listMyInboxMessages);
  const markRead = useServerFn(markInboxMessagesRead);

  const accessQuery = useQuery({
    queryKey: ["admin", "access", token],
    enabled: Boolean(token) && active,
    queryFn: async () => {
      if (!token) return { admin: false };
      return checkAccess({ data: { accessToken: token } });
    },
    staleTime: 10 * 60_000,
  });

  const accessKnown = accessQuery.isSuccess || accessQuery.isError;
  const isAdmin = accessQuery.data?.admin === true;

  const adminReportsQuery = useQuery({
    queryKey: ["beta-reports", "admin", token],
    enabled: Boolean(token) && active && accessKnown && isAdmin,
    queryFn: async () => {
      if (!token) return [];
      return listAdminReports({ data: { accessToken: token } });
    },
  });

  const myReportsQuery = useQuery({
    queryKey: ["beta-reports", "mine", token],
    enabled: Boolean(token) && active && accessKnown && !isAdmin,
    queryFn: async () => {
      if (!token) return [];
      return listMyReports({ data: { accessToken: token } });
    },
  });

  const messagesQuery = useQuery({
    queryKey: ["inbox", "messages", token],
    enabled: Boolean(token) && active,
    queryFn: async () => {
      if (!token) return [];
      return listMessages({ data: { accessToken: token } });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No session");
      return markRead({ data: { accessToken: token } });
    },
    onSuccess: () => {
      void queryClient.setQueryData(
        ["inbox", "messages", token],
        (old: InboxMessage[] | undefined) =>
          old?.map((m) => ({ ...m, read: true })),
      );
      refreshInboxBadges(queryClient);
    },
  });

  const unreadCount =
    messagesQuery.data?.filter((m) => !m.read).length ?? 0;

  if (!token) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">Sign in to view inbox.</p>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {unreadCount > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-[13px] text-muted-foreground">
            {unreadCount} unread message{unreadCount === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            disabled={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
            className="text-[12px] font-medium text-primary disabled:opacity-50"
          >
            {markAllMutation.isPending ? "Marking…" : "Mark all as read"}
          </button>
        </div>
      ) : null}

      {accessKnown && isAdmin ? <ComposePanel token={token} /> : null}

      {accessQuery.isLoading ? (
        <SectionSpinner />
      ) : isAdmin ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Problem reports</h2>
          {adminReportsQuery.isLoading ? (
            <SectionSpinner />
          ) : !adminReportsQuery.data?.length ? (
            <p className="rounded-2xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
              No reports yet.
            </p>
          ) : (
            <div className="space-y-2">
              {adminReportsQuery.data.map((report) => (
                <ReportCard key={report.id} report={report} showEmail adminReplyUi />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold">From Rinja</h2>
            {messagesQuery.isLoading ? (
              <SectionSpinner />
            ) : !messagesQuery.data?.length ? (
              <p className="rounded-2xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
                No messages yet.
              </p>
            ) : (
              <div className="space-y-2">
                {messagesQuery.data.map((m) => (
                  <MessageCard key={m.id} message={m} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">Your reports</h2>
            {myReportsQuery.isLoading ? (
              <SectionSpinner />
            ) : !myReportsQuery.data?.length ? (
              <p className="rounded-2xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
                You haven’t reported anything yet.
              </p>
            ) : (
              <div className="space-y-2">
                {myReportsQuery.data.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {accessKnown && isAdmin ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Your messages</h2>
          {messagesQuery.isLoading ? (
            <SectionSpinner />
          ) : !messagesQuery.data?.length ? (
            <p className="rounded-2xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
              Nothing in your personal inbox yet.
            </p>
          ) : (
            <div className="space-y-2">
              {messagesQuery.data.map((m) => (
                <MessageCard key={m.id} message={m} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

/** Full-screen sheet over Profile — closed by default. */
export function InboxSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50">
      <button
        type="button"
        aria-label="Close inbox"
        className="min-h-[8vh] flex-shrink-0"
        onClick={() => onOpenChange(false)}
      />
      <div className="flex min-h-0 flex-1 flex-col rounded-t-3xl border border-border bg-background shadow-2xl screen-safe">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            <h2 className="text-[18px] font-semibold tracking-tight">Inbox</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
          <InboxBody active={open} />
        </div>
      </div>
    </div>
  );
}
