import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Link2, ClipboardPaste, MousePointerClick, FileText, Type } from "lucide-react";
import { z } from "zod";
import { requireAuth } from "../lib/requireAuth";

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
      <button
        type="button"
        onClick={() => navigate({ to: "/home" })}
        aria-label="Back"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <h1 className="text-[28px] font-semibold tracking-tight">Add a watch</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste any URL. Then choose how I should watch it — even if the site
        won’t preview inside the app.
      </p>

      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          autoFocus
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button type="button" onClick={() => void paste()} className="text-xs text-primary">
          <ClipboardPaste className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-2 pb-8">
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
          onClick={goPaste}
          disabled={!isValid}
          className="flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-semibold transition active:scale-[0.98] disabled:opacity-40"
        >
          <Type className="h-4 w-4" />
          Paste price or text
        </button>
        <button
          type="button"
          onClick={goPage}
          disabled={!isValid}
          className="flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-semibold transition active:scale-[0.98] disabled:opacity-40"
        >
          <FileText className="h-4 w-4" />
          Watch whole page
        </button>
        <p className="pt-1 text-center text-[11px] text-muted-foreground">
          Highlight needs a working preview. If nothing is selectable, use
          paste or whole page instead.
        </p>
      </div>
    </div>
  );
}
