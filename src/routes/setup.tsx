import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { requireAuth } from "../lib/requireAuth";
import { hostFromUrl } from "../lib/store";
import { createWatch } from "../lib/watches";
import { createStartedNotification } from "../lib/notifications";

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
  if (err instanceof Error && err.message) return err.message;
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

function SetupWatch() {
  const navigate = useNavigate();
  const { url, intent } = Route.useSearch();
  const host = hostFromUrl(url);

  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        // Some DB schemas require a non-empty selector; page mode ignores it.
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

  const savePasteWatch = async () => {
    const text = value.trim();
    if (!text) return;

    try {
      setLoading(true);
      setError("");

      const label =
        text.length > 42 ? `Text · ${text.slice(0, 40)}…` : `Text · ${text}`;

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
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
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
          <h1 className="text-[28px] font-semibold tracking-tight">
            Any change on the page
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            I&apos;ll check {host} regularly and alert you if the page content
            changes — no highlight needed. Works even when preview looks blank.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-card/50 px-4 py-3 text-[13px] text-muted-foreground">
            <p className="truncate font-medium text-foreground">{host}</p>
            <p className="mt-1 break-all opacity-80">{url}</p>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          ) : null}

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
          <h1 className="text-[28px] font-semibold tracking-tight">
            If this text leaves the page
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the real site in your browser, copy the exact text you care
            about, and paste it here. I&apos;ll alert you if it disappears from
            the page (or comes back).
          </p>

          <label className="mt-8 block">
            <span className="mb-1.5 block px-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Text to watch
            </span>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              placeholder="e.g. In stock, 1,299, Sold out…"
              className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-[15px] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {error ? (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          ) : null}

          <div className="mt-auto flex flex-col gap-2 pb-8">
            <button
              type="button"
              onClick={() => void savePasteWatch()}
              disabled={loading || !value.trim()}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
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
