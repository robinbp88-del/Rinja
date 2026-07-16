import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  X,
  Loader2,
  MousePointerClick,
  Check,
  Tag,
  Package,
  Type,
  Image as ImageIcon,
  Sparkles,
  Settings2,
} from "lucide-react";
import { z } from "zod";
import { useStore, hostFromUrl, type WatchMode } from "../lib/store";
import rinja from "../assets/rinja.png";

const searchSchema = z.object({ url: z.string().url() });

export const Route = createFileRoute("/highlight")({
  validateSearch: (s) => searchSchema.parse(s),
  component: Highlight,
});

type Selection = {
  selector: string;
  tag: string;
  text: string;
  html: string;
};

type Kind = "price" | "stock" | "date" | "image" | "text";
type SaveState = "idle" | "saving" | "done";

function Highlight() {
  const { url } = Route.useSearch();
  const navigate = useNavigate();
  const { addWatch } = useStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [picking, setPicking] = useState(false);
  const [mode, setMode] = useState<WatchMode>("any");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const host = hostFromUrl(url);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const d = ev.data;
      if (!d || d.source !== "watchpage-picker") return;
      if (d.type === "ready") {
        setReady(true);
        if (d.payload?.title) setPageTitle(d.payload.title);
      } else if (d.type === "selected") {
        const sel = d.payload as Selection;
        setSelection(sel);
        setSaveState("idle");
        setMode(defaultModeFor(detectKind(sel)));
        if (navigator.vibrate) navigator.vibrate(8);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const post = (type: string) =>
    iframeRef.current?.contentWindow?.postMessage(
      { source: "watchpage-host", type },
      "*",
    );

  const enablePicking = () => {
    setPicking(true);
    post("enable");
    if (navigator.vibrate) navigator.vibrate(6);
  };

  const exitPicking = () => {
    setPicking(false);
    setSelection(null);
    setSaveState("idle");
    post("disable");
  };

  const dismissSheet = () => {
    setSelection(null);
    setSaveState("idle");
    post("clear");
  };

  const kind = detectKind(selection);
  const options = useMemo(() => optionsFor(kind), [kind]);

  const save = () => {
    if (!selection || saveState !== "idle") return;
    setSaveState("saving");
    const label = labelFor(kind, mode, selection.text);
    const value = selection.text || selection.html.slice(0, 80);

    addWatch(
      {
        url,
        host,
        title: pageTitle || host,
        label,
        currentValue: value,
        frequency: "15m",
        selector: selection.selector,
        mode,
      } as never,
      {
        eventTitle: "I'm watching",
        eventBody: `👀 On it — ${label} · ${host}`,
      },
    );

    if (navigator.vibrate) navigator.vibrate(10);

    setTimeout(() => {
      setSaveState("done");
      post("mark");
      setTimeout(() => {
        setSelection(null);
        setSaveState("idle");
        setPicking(false);
      }, 850);
    }, 550);
  };

  const src = `/api/proxy?url=${encodeURIComponent(url)}`;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Chrome */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl screen-safe">
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            onClick={() => navigate({ to: "/add", search: { url } as never })}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 truncate rounded-full bg-card px-4 py-2 text-center text-xs text-muted-foreground">
            {host}
          </div>
          <button
            aria-label="Close"
            onClick={() => navigate({ to: "/home" })}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {picking && !selection && (
          <div className="border-t border-border/50 bg-primary/10 px-4 py-2 text-center text-[11px] font-medium uppercase tracking-widest text-primary">
            Tap anything on the page
          </div>
        )}
      </div>

      {/* WebView */}
      <div className="relative flex-1">
        {!ready && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading {host}…</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={src}
          title={`Preview of ${host}`}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          className="w-full border-0 bg-white h-[calc(100vh-64px)]"
        />
      </div>

      {/* Floating Highlight button */}
      {!picking && !selection && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-end px-4 pb-5 screen-safe pointer-events-none">
          <button
            onClick={enablePicking}
            className="pointer-events-auto flex h-14 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/40 glow-ring transition active:scale-95"
          >
            <MousePointerClick className="h-5 w-5" strokeWidth={2.6} />
            Highlight
          </button>
        </div>
      )}

      {/* Done button while picking, no selection yet */}
      {picking && !selection && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-center px-4 pb-5 screen-safe pointer-events-none">
          <button
            onClick={exitPicking}
            className="pointer-events-auto flex h-12 items-center gap-2 rounded-full bg-card px-6 text-sm font-semibold border border-border shadow-xl transition active:scale-95"
          >
            <Check className="h-4 w-4" /> Done
          </button>
        </div>
      )}

      {/* Selection Bottom Sheet */}
      {selection && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={saveState === "idle" ? dismissSheet : undefined}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-3 pb-3 screen-safe">
            <div className="rounded-[28px] border border-border bg-card/98 p-5 backdrop-blur-2xl shadow-2xl animate-scale-in">
              {/* Rinja + question */}
              <div className="flex items-start gap-3">
                <img
                  src={rinja}
                  alt=""
                  className="h-14 w-14 flex-shrink-0 object-contain"
                />
                <div className="flex-1 pt-1">
                  <p className="text-[11px] uppercase tracking-widest text-primary">
                    {kindLabel(kind)}
                  </p>
                  <h3 className="mt-1 text-[19px] font-semibold leading-snug tracking-tight">
                    Should I keep an eye on this?
                  </h3>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                {kind === "image" ? (
                  <ImagePreview html={selection.html} />
                ) : (
                  <p className="truncate text-[15px] font-medium">
                    {selection.text?.trim() || (
                      <span className="text-muted-foreground">{selection.tag}</span>
                    )}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="mt-4 flex flex-wrap gap-2">
                {options.map((o) => {
                  const active = mode === o.value;
                  return (
                    <button
                      key={o.value}
                      disabled={saveState !== "idle"}
                      onClick={() => setMode(o.value)}
                      className={`flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${
                        active
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-background/40 text-foreground/80 hover:bg-background/70"
                      }`}
                    >
                      <o.icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                      {o.label}
                    </button>
                  );
                })}
              </div>

              {/* Save */}
              <button
                onClick={save}
                disabled={saveState !== "idle"}
                className={`mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.98] ${
                  saveState === "done"
                    ? "bg-primary/20 text-primary"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                }`}
              >
                {saveState === "idle" && "Yes"}
                {saveState === "saving" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Watching…
                  </>
                )}
                {saveState === "done" && (
                  <>
                    <Check className="h-4 w-4" strokeWidth={3} />
                    I'm watching
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ImagePreview({ html }: { html: string }) {
  const src = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  if (!src) {
    return <p className="text-[13px] text-muted-foreground">Image element</p>;
  }
  return (
    <div className="flex items-center gap-3">
      <img
        src={src}
        alt=""
        className="h-14 w-14 rounded-xl object-cover border border-border/60"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      <p className="truncate text-[13px] text-muted-foreground">Image</p>
    </div>
  );
}

function detectKind(sel: Selection | null): Kind {
  if (!sel) return "text";
  if (sel.tag === "img" || /<img\b/i.test(sel.html)) return "image";
  const t = sel.text.trim();
  if (!t) return "text";
  if (/([$€£¥₹]|\bkr\b|\bNOK\b|\bUSD\b|\bEUR\b|\bGBP\b)\s?\d/i.test(t)) return "price";
  if (/^\s*[$€£¥₹]?\s?\d{1,3}([.,\s]\d{3})*([.,]\d{1,2})?\s?(kr|NOK|USD|EUR|GBP|\$|€|£)?\s*$/i.test(t))
    return "price";
  if (/(in stock|out of stock|sold out|available|unavailable|på lager|utsolgt)/i.test(t))
    return "stock";
  if (/\b(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\b/.test(t)) return "date";
  if (/\b(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(t))
    return "date";
  return "text";
}

function kindLabel(k: Kind) {
  return k === "price"
    ? "Price detected"
    : k === "stock"
    ? "Stock detected"
    : k === "date"
    ? "Date detected"
    : k === "image"
    ? "Image detected"
    : "Element selected";
}

function defaultModeFor(k: Kind): WatchMode {
  if (k === "price") return "price";
  if (k === "stock") return "stock";
  if (k === "image") return "image";
  return "any";
}

type Option = { value: WatchMode; label: string; icon: typeof Tag };

function optionsFor(k: Kind): Option[] {
  const base: Option[] = [];
  if (k === "price") {
    base.push({ value: "price", label: "Price", icon: Tag });
  } else if (k === "stock") {
    base.push({ value: "stock", label: "Stock", icon: Package });
  } else if (k === "image") {
    base.push({ value: "image", label: "Image", icon: ImageIcon });
  } else {
    base.push({ value: "text", label: "Text", icon: Type });
  }
  base.push({ value: "any", label: "Any change", icon: Sparkles });
  base.push({ value: "custom", label: "Custom…", icon: Settings2 });
  return base;
}

function labelFor(k: Kind, mode: WatchMode, text: string) {
  const trimmed = text.trim().slice(0, 40);
  if (mode === "price") return `Price · ${trimmed}`;
  if (mode === "stock") return "Stock availability";
  if (mode === "image") return "Image";
  if (mode === "text") return trimmed || "Text element";
  if (mode === "custom") return trimmed || `${k} element`;
  return trimmed || "Any change";
}
