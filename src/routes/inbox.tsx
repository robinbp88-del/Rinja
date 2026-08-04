import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Inbox, Loader2, Send } from "lucide-react";

import { BottomNav } from "../components/BottomNav";
import { timeAgoLabel, useAccessToken } from "../components/BetaChrome";
import { checkAdminAccess } from "../lib/admin.functions";
import {
  listAdminBetaReports,
  listMyBetaReports,
  replyToBetaReport,
  type BetaReport,
} from "../lib/beta-report.functions";
import {
  getInboxUnreadCount,
  listInboxRecipients,
  listMyInboxMessages,
  markInboxMessagesRead,
  sendInboxMessage,
  type InboxMessage,
} from "../lib/inbox.functions";
import { requireAuth } from "../lib/requireAuth";

export const Route = createFileRoute("/inbox")({
  beforeLoad: requireAuth,
  component: InboxPage,
});

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
      void queryClient.invalidateQueries({ queryKey: ["inbox"] });
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
          {timeAgoLabel(report.created_at)}
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

function MessageCard({ message }: { message: InboxMessage }) {
  return (
    <div
      className={`rounded-2xl border bg-card p-4 ${
        message.read ? "border-border" : "border-primary/40"
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
          </p>
          <p className="mt-1 text-sm font-medium">{message.title}</p>
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {timeAgoLabel(message.created_at)}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-snug text-muted-foreground">
        {message.body}
      </p>
    </div>
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

  const recipientsQuery = useQuery({
    queryKey: ["inbox", "recipients", token],
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
    },
    onError: () => setNote("Could not send. Try again."),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
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
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
      >
        <option value="all">Everyone</option>
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

function InboxPage() {
  const token = useAccessToken();
  const queryClient = useQueryClient();
  const checkAccess = useServerFn(checkAdminAccess);
  const listAdminReports = useServerFn(listAdminBetaReports);
  const listMyReports = useServerFn(listMyBetaReports);
  const listMessages = useServerFn(listMyInboxMessages);
  const markRead = useServerFn(markInboxMessagesRead);
  const unreadFn = useServerFn(getInboxUnreadCount);

  const accessQuery = useQuery({
    queryKey: ["admin", "access", token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) return { admin: false };
      return checkAccess({ data: { accessToken: token } });
    },
    staleTime: 5 * 60_000,
  });

  const isAdmin = accessQuery.data?.admin === true;

  const adminReportsQuery = useQuery({
    queryKey: ["beta-reports", "admin", token],
    enabled: Boolean(token) && isAdmin,
    queryFn: async () => {
      if (!token) return [];
      return listAdminReports({ data: { accessToken: token } });
    },
  });

  const myReportsQuery = useQuery({
    queryKey: ["beta-reports", "mine", token],
    enabled: Boolean(token) && !isAdmin,
    queryFn: async () => {
      if (!token) return [];
      return listMyReports({ data: { accessToken: token } });
    },
  });

  const messagesQuery = useQuery({
    queryKey: ["inbox", "messages", token],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) return [];
      return listMessages({ data: { accessToken: token } });
    },
  });

  useEffect(() => {
    if (!token) return;
    void markRead({ data: { accessToken: token } }).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["inbox", "unread"] });
      void unreadFn({ data: { accessToken: token } });
    });
  }, [token, markRead, queryClient, unreadFn]);

  const loading =
    !token ||
    accessQuery.isLoading ||
    messagesQuery.isLoading ||
    (isAdmin ? adminReportsQuery.isLoading : myReportsQuery.isLoading);

  return (
    <div className="min-h-screen pb-32">
      <header className="flex items-center gap-3 px-4 pt-6 screen-safe">
        <Link
          to="/profile"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" />
          <h1 className="text-[22px] font-semibold tracking-tight">Inbox</h1>
        </div>
      </header>

      <div className="mt-5 space-y-6 px-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {isAdmin && token ? <ComposePanel token={token} /> : null}

            {isAdmin ? (
              <section>
                <h2 className="mb-3 text-sm font-semibold">Problem reports</h2>
                {!adminReportsQuery.data?.length ? (
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
                  {!messagesQuery.data?.length ? (
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
                  {!myReportsQuery.data?.length ? (
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

            {isAdmin ? (
              <section>
                <h2 className="mb-3 text-sm font-semibold">Your copy of messages</h2>
                <p className="mb-2 text-[12px] text-muted-foreground">
                  Messages you send also land in each user’s Inbox (including yours if you’re in the
                  list).
                </p>
                {!messagesQuery.data?.length ? (
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
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
