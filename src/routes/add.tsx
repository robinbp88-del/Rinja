import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Link2, ClipboardPaste } from "lucide-react";
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

  const isValid = /^https?:\/\/.+\..+/i.test(url.trim());

  const open = () => {
    if (!isValid) return;
    navigate({ to: "/highlight", search: { url: url.trim() } as any });
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {}
  };

  return (
    <div className="flex min-h-screen flex-col px-6 pt-6 screen-safe">
      <button
        onClick={() => navigate({ to: "/home" })}
        aria-label="Back"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <h1 className="text-[28px] font-semibold tracking-tight">Add a watch</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste any URL. You'll pick what to monitor on the next screen.
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
        <button onClick={paste} className="text-xs text-primary">
          <ClipboardPaste className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-2 pb-8">
        <button
          onClick={open}
          disabled={!isValid}
          className="flex h-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-40"
        >
          Open page
        </button>
        <p className="text-center text-[11px] text-muted-foreground">
          Shared from another app? WatchPage will open here automatically on native.
        </p>
      </div>
    </div>
  );
}
