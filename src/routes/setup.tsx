import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ClipboardPaste, ExternalLink, Loader2 } from "lucide-react";
import { z } from "zod";
import { requireAuth } from "../lib/requireAuth";
import { hostFromUrl } from "../lib/store";
import { htmlContainsVisibleText } from "../lib/text-presence";
import { createWatch } from "../lib/watches";
import { createStartedNotification } from "../lib/notifications";
import { createProxyTicket } from "../lib/proxy-ticket.functions";
import { buildProxyUrl } from "../lib/proxy-url";
import { toUserError } from "../lib/user-errors";
import { supabase } from "../lib/supabase";

const searchSchema = z.object({
  url: z.string().url(),
  intent: z.enum(["page", "paste"]),
});

export const Route = createFileRoute("/setup")({
  beforeLoad: requireAuth,
  validateSearch: (s) => searchSchema.parse(s),
  component: SetupWatch,
});

function errorMessage(err: unknown, fallback = "Could not create watch") {
  return toUserError(err, fallback);
}

function SetupWatch() {
  const navigate = useNavigate();
  const { url, intent } = Route.useSearch();
  const host = hostFromUrl(url);

  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [presenceWarning, setPresenceWarning] = useState<string | null>(null);

  const pasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setValue(text.trim());
        setPresenceWarning(null);
        setError("");
      }
    } catch {
      setError("Couldn’t read clipboard — paste manually.");
    }
  };

  const savePageWatch = async () => {
    try {
      setLoading(true);
      setError("");

      const created = await createWatch({
        url,
        host,
        title: host,
        label: `Page · ${host}`,
        currentValue: "",
        selector: "html",
        elementText: "",
        elementTag: "page",
        elementHtml: "",
        mode: "any",
        frequency: "15m",
        notify: true,
        baselinePending: true,
      });

      try {
        await createStartedNotification({
          watchId: created.id,
          label: created.label,
          host,
        });
      } catch (notifyErr) {
        console.warn("Watch created, notification failed:", notifyErr);
      }

      navigate({ to: "/watching", search: { id: created.id } });
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createPasteWatch = async (text: string) => {
    const label = text.length > 42 ? `Text · ${text.slice(0, 40)}…` : `Text · ${text}`;

    const created = await createWatch({
      url,
      host,
      title: host,
      label,
      currentValue: text,
      selector: "",
      elementText: text,
      elementTag: "text",
      elementHtml: "",
      mode: "text",
      frequency: "15m",
      notify: true,
    });

    try {
      await createStartedNotification({
        watchId: created.id,
        label: created.label,
        host,
      });
    } catch (notifyErr) {
      console.warn("Watch created, notification failed:", notifyErr);
    }

    navigate({ to: "/watching", search: { id: created.id } });
  };

  const savePasteWatch = async (opts?: { force?: boolean }) => {
    const text = value.trim();
    if (!text) return;

    try {
      setLoading(true);
      setError("");

      if (!opts?.force && !presenceWarning) {
        setChecking(true);
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (token) {
            const { ticket } = await createProxyTicket({
              data: { accessToken: token },
            });
            const res = await fetch(buildProxyUrl(url, ticket), {
              headers: { Accept: "text/html" },
            });
            if (res.ok) {
              const html = await res.text();
              if (!htmlContainsVisibleText(html, text)) {
                setPresenceWarning(
                  "I couldn’t find that exact text on the page yet. Check the copy, or start watching anyway.",
                );
                setLoading(false);
                setChecking(false);
                return;
              }
            }
          }
        } catch {
          // Network/proxy issues — don’t block create.
        } finally {
          setChecking(false);
        }
      }

      await createPasteWatch(text);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 pt-6 screen-safe">
      <button
        type="button"
        onClick={() => navigate({ to: "/add", search: { url } as never })}
        aria-label="Back"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      {intent === "page" ? (
        <>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Step 2 of 2</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Any change on the page</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            I&apos;ll check {host} regularly and alert you if the page content changes — no
            highlight needed.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-card/50 px-4 py-3 text-[13px] text-muted-foreground">
            <p className="truncate font-medium text-foreground">{host}</p>
            <p className="mt-1 break-all opacity-80">{url}</p>
          </div>

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

          <div className="mt-auto flex flex-col gap-2 pb-8">
            <button
              type="button"
              onClick={() => void savePageWatch()}
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                "Start watching"
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Step 2 of 2</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Paste the text to watch</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            On the site, copy the exact words you care about. Paste them here — I&apos;ll alert you
            if they leave the page.
          </p>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/50 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{host}</p>
              <p className="truncate text-[11px] text-muted-foreground">{url}</p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-primary"
            >
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <ol className="mt-5 space-y-1.5 text-[12px] text-muted-foreground">
            <li>1. Tap Open and find the text on the real site</li>
            <li>2. Copy it exactly</li>
            <li>3. Paste below and start watching</li>
          </ol>

          <label className="mt-6 block">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Text to watch
              </span>
              <button
                type="button"
                onClick={() => void pasteText()}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                Paste
              </button>
            </div>
            <textarea
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setPresenceWarning(null);
              }}
              rows={4}
              autoFocus
              placeholder="e.g. Sold out · Available · 1 299"
              className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-[15px] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {presenceWarning ? (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-800 dark:text-amber-200">
              <p>{presenceWarning}</p>
              <button
                type="button"
                disabled={loading}
                onClick={() => void savePasteWatch({ force: true })}
                className="mt-2 text-[13px] font-semibold text-primary underline-offset-2 hover:underline"
              >
                Start watching anyway
              </button>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

          <div className="mt-auto flex flex-col gap-2 pb-8 pt-6">
            <button
              type="button"
              onClick={() => void savePasteWatch()}
              disabled={loading || checking || !value.trim()}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {loading || checking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {checking ? "Checking page…" : "Starting…"}
                </>
              ) : (
                "Start watching"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
