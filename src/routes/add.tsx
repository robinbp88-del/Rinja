import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Link2,
  ClipboardPaste,
  MousePointerClick,
  FileText,
  Type,
  X,
  ChevronDown,
} from "lucide-react";
import { z } from "zod";
import { requireAuth } from "../lib/requireAuth";
import { hostFromUrl } from "../lib/store";
import { looksLikeSiteHome, normalizeWatchUrl } from "../lib/url-input";
import { logSearchEvent } from "../lib/activity";

const searchSchema = z.object({ url: z.string().optional() });

export const Route = createFileRoute("/add")({
  beforeLoad: requireAuth,
  validateSearch: (s) => searchSchema.parse(s),
  component: AddWatch,
});

function AddWatch() {
  const navigate = useNavigate();
  const { url: initialUrl } = Route.useSearch();
  const [url, setUrl] = useState(initialUrl ?? "");
  const [showMore, setShowMore] = useState(false);

  const normalized = normalizeWatchUrl(url);
  const isValid = Boolean(normalized);
  const host = normalized ? hostFromUrl(normalized) : "";
  const homeHint = normalized ? looksLikeSiteHome(normalized) : false;

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // ignore
    }
  };

  const goPaste = () => {
    if (!normalized) return;
    void logSearchEvent(normalized);
    navigate({
      to: "/setup",
      search: { url: normalized, intent: "paste" },
    });
  };

  const goPage = () => {
    if (!normalized) return;
    void logSearchEvent(normalized);
    navigate({
      to: "/setup",
      search: { url: normalized, intent: "page" },
    });
  };

  const goHighlight = () => {
    if (!normalized) return;
    void logSearchEvent(normalized);
    navigate({ to: "/highlight", search: { url: normalized } as never });
  };

  return (
    <div className="flex min-h-screen flex-col px-6 pt-6 screen-safe">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ to: "/home" })}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/home" })}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
        New watch
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
        Paste the page URL
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Then highlight what matters in the in-app preview.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isValid) {
              e.preventDefault();
              goHighlight();
            }
          }}
          placeholder="https://…"
          autoFocus
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => void paste()}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-primary"
          aria-label="Paste from clipboard"
        >
          <ClipboardPaste className="h-4 w-4" />
          Paste
        </button>
      </div>

      {isValid ? (
        <p className="mt-2 truncate px-1 text-[12px] text-muted-foreground">
          {host}
        </p>
      ) : url.trim() ? (
        <p className="mt-2 px-1 text-[12px] text-destructive">
          That doesn’t look like a full URL yet.
        </p>
      ) : null}

      {homeHint ? (
        <p className="mt-2 px-1 text-[12px] text-amber-700 dark:text-amber-300">
          This looks like a homepage. Product or listing URLs work much better.
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pb-8 pt-8">
        <button
          type="button"
          onClick={goHighlight}
          disabled={!isValid}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-40"
        >
          <MousePointerClick className="h-4 w-4" />
          Highlight on page
        </button>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center justify-center gap-1 py-2 text-[12px] font-medium text-muted-foreground"
        >
          Other ways
          <ChevronDown
            className={`h-3.5 w-3.5 transition ${showMore ? "rotate-180" : ""}`}
          />
        </button>

        {showMore ? (
          <div className="space-y-2">
            <OptionCard
              icon={<Type className="h-5 w-5" />}
              title="Paste text to watch"
              description="If preview won’t load — copy text from your browser"
              onClick={goPaste}
              disabled={!isValid}
            />
            <OptionCard
              icon={<FileText className="h-5 w-5" />}
              title="Any change on the page"
              description="Alert me if the page content changes"
              onClick={goPage}
              disabled={!isValid}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OptionCard(props: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition active:scale-[0.99] disabled:opacity-40"
    >
      <span className="mt-0.5 shrink-0 text-primary">{props.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{props.title}</span>
        <span className="mt-0.5 block text-[12px] text-muted-foreground">
          {props.description}
        </span>
      </span>
    </button>
  );
}
