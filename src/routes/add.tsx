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
} from "lucide-react";
import { z } from "zod";
import { requireAuth } from "../lib/requireAuth";
import { hostFromUrl } from "../lib/store";

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

  const trimmed = url.trim();
  const isValid = /^https?:\/\/.+\..+/i.test(trimmed);
  const host = isValid ? hostFromUrl(trimmed) : "";

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // ignore
    }
  };

  const goHighlight = () => {
    if (!isValid) return;
    navigate({ to: "/highlight", search: { url: trimmed } as never });
  };

  const goPage = () => {
    if (!isValid) return;
    navigate({
      to: "/setup",
      search: { url: trimmed, intent: "page" },
    });
  };

  const goPaste = () => {
    if (!isValid) return;
    navigate({
      to: "/setup",
      search: { url: trimmed, intent: "paste" },
    });
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

      <h1 className="text-[28px] font-semibold tracking-tight">New watch</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste the full page URL, then choose what I should watch for.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          autoFocus
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => void paste()}
          className="text-xs text-primary"
          aria-label="Paste from clipboard"
        >
          <ClipboardPaste className="h-4 w-4" />
        </button>
      </div>

      {isValid ? (
        <p className="mt-2 truncate px-1 text-[12px] text-muted-foreground">
          {host}
        </p>
      ) : null}

      <p className="mt-8 text-[11px] uppercase tracking-widest text-muted-foreground">
        What should I watch for?
      </p>

      <div className="mt-3 space-y-2">
        <OptionCard
          icon={<Type className="h-5 w-5" />}
          title="If this text leaves the page"
          description="Paste a price, “in stock”, or other text to watch"
          onClick={goPaste}
          disabled={!isValid}
          primary
        />
        <OptionCard
          icon={<FileText className="h-5 w-5" />}
          title="Any change on the page"
          description="Alert me if the page content changes"
          onClick={goPage}
          disabled={!isValid}
        />
        <OptionCard
          icon={<MousePointerClick className="h-5 w-5" />}
          title="Pick text on the page"
          description="Highlight in preview when the site allows it"
          onClick={goHighlight}
          disabled={!isValid}
        />
      </div>

      <p className="mt-4 pb-8 text-center text-[11px] text-muted-foreground">
        Highlight needs a working preview. Paste or whole page are more
        reliable.
      </p>
    </div>
  );
}

function OptionCard(props: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.99] disabled:opacity-40 ${
        props.primary
          ? "border-primary/50 bg-primary text-primary-foreground"
          : "border-border bg-card"
      }`}
    >
      <span
        className={`mt-0.5 shrink-0 ${
          props.primary ? "text-primary-foreground" : "text-primary"
        }`}
      >
        {props.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{props.title}</span>
        <span
          className={`mt-0.5 block text-[12px] ${
            props.primary
              ? "text-primary-foreground/80"
              : "text-muted-foreground"
          }`}
        >
          {props.description}
        </span>
      </span>
    </button>
  );
}
