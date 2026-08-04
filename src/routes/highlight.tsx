import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  X,
  Loader2,
  MousePointerClick,
  Check,
  Type,
  Image as ImageIcon,
  Sparkles,
  Settings2,
  Bell,
  BellOff,
} from "lucide-react";
import { z } from "zod";

import { hostFromUrl } from "../lib/store";
import type { WatchMode } from "../lib/watch-mode";
import {
  isTrustedPickerEvent,
  parsePickerMessage,
  postToPicker,
  type PickerSelection,
} from "../lib/picker-protocol";
import {
  defaultModeFor,
  detectKind,
  kindLabel,
  labelFor,
  type ElementKind,
} from "../lib/highlight-detect";
import { createWatch, getWatchById, updateWatchSelection } from "../lib/watches";
import { createStartedNotification } from "../lib/notifications";
import { requireAuth } from "../lib/requireAuth";
import { createProxyTicket } from "../lib/proxy-ticket.functions";
import { buildProxyUrl } from "../lib/proxy-url";
import { toUserError } from "../lib/user-errors";
import { supabase } from "../lib/supabase";
import rinja from "../assets/rinja.webp";

const searchSchema = z.object({
  url: z.string().url(),
  selector: z.string().optional(),
  watchId: z.string().optional(),
});

export const Route = createFileRoute("/highlight")({
  beforeLoad: requireAuth,
  validateSearch: (search) => searchSchema.parse(search),
  component: Highlight,
});

type SaveState = "idle" | "saving" | "done";

function Highlight() {
  const { url, selector: searchSelector, watchId } = Route.useSearch();

  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [ready, setReady] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [selection, setSelection] = useState<PickerSelection | null>(null);
  const [picking, setPicking] = useState(false);
  const pickingRef = useRef(false);
  pickingRef.current = picking;
  const [mode, setMode] = useState<WatchMode>("any");
  const [notify, setNotify] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [resolvedSelector, setResolvedSelector] = useState(searchSelector ?? "");
  const [proxySrc, setProxySrc] = useState<string | null>(null);
  const [proxyError, setProxyError] = useState<string | null>(null);

  const host = hostFromUrl(url);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          if (!cancelled) {
            setProxyError("Please sign in again to preview pages.");
          }
          return;
        }
        const { ticket } = await createProxyTicket({
          data: { accessToken: token },
        });
        if (cancelled) return;
        setProxySrc(buildProxyUrl(url, ticket));
        setProxyError(null);
      } catch (error) {
        console.error("Could not mint proxy ticket:", error);
        if (!cancelled) {
          setProxyError("Could not load page preview. Please try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    if (searchSelector) {
      setResolvedSelector(searchSelector);
      return;
    }

    if (!watchId) {
      setResolvedSelector("");
      return;
    }

    let cancelled = false;

    getWatchById(watchId)
      .then((watch) => {
        if (cancelled) return;
        setResolvedSelector(watch?.selector?.trim() ?? "");
      })
      .catch((error) => {
        console.error("Could not load saved selector:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [searchSelector, watchId]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = parsePickerMessage(event.data);
      if (!message) return;
      if (!isTrustedPickerEvent(event, iframeRef.current?.contentWindow)) {
        return;
      }

      if (message.type === "ready") {
        setReady(true);

        if (message.payload?.title) {
          setPageTitle(message.payload.title);
        }

        // Highlight may have been pressed before the picker finished loading.
        if (pickingRef.current) {
          postToPicker(iframeRef.current?.contentWindow, "enable");
        }

        return;
      }

      if (message.type === "selected") {
        setSelection(message.payload);
        setSaveState("idle");
        setMode(defaultModeFor(detectKind(message.payload)));

        if (navigator.vibrate) {
          navigator.vibrate(8);
        }

        return;
      }

      if (message.type === "revealed") {
        console.info("Saved element revealed:", message.payload?.selector);
        return;
      }

      if (message.type === "reveal-missing") {
        console.warn("Saved element could not be found:", message.payload?.selector);
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (!ready || !resolvedSelector || !iframeRef.current?.contentWindow) {
      return;
    }

    const reveal = () => {
      postToPicker(iframeRef.current?.contentWindow, "reveal", {
        selector: resolvedSelector,
      });
    };

    const timers = [
      window.setTimeout(reveal, 400),
      window.setTimeout(reveal, 1200),
      window.setTimeout(reveal, 2500),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [ready, resolvedSelector]);

  const post = (type: "enable" | "disable" | "clear" | "mark", extra?: Record<string, unknown>) => {
    postToPicker(iframeRef.current?.contentWindow, type, extra);
  };

  const enablePicking = () => {
    setPicking(true);
    post("enable");

    if (navigator.vibrate) {
      navigator.vibrate(6);
    }
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

  const save = async () => {
    if (!selection || saveState !== "idle") {
      return;
    }

    setSaveState("saving");

    const label = labelFor(kind, mode, selection.text);
    const value = selection.text || selection.html.slice(0, 80);

    try {
      let createdId = watchId ?? "";

      if (watchId) {
        await updateWatchSelection(watchId, {
          label,
          currentValue: value,
          selector: selection.selector,
          elementText: selection.text,
          elementTag: selection.tag,
          elementHtml: selection.html,
          mode,
          notify,
        });
      } else {
        const created = await createWatch({
          url,
          host,
          title: pageTitle || host,
          label,
          currentValue: value,
          selector: selection.selector,
          elementText: selection.text,
          elementTag: selection.tag,
          elementHtml: selection.html,
          mode,
          frequency: "15m",
          notify,
        });
        createdId = created.id;

        if (notify) {
          await createStartedNotification({
            watchId: created.id,
            label,
            host,
          });
        }
      }

      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      setSaveState("done");
      post("mark");

      window.setTimeout(() => {
        setSelection(null);
        setSaveState("idle");
        setPicking(false);

        if (watchId) {
          navigate({
            to: "/watch/$id",
            params: { id: watchId },
          });
        } else {
          navigate({
            to: "/watching",
            search: { id: createdId },
          });
        }
      }, 850);
    } catch (error) {
      console.error("Could not save watch:", error);
      setSaveState("idle");
      window.alert(toUserError(error, "Could not save the watch."));
    }
  };

  const handleBack = () => {
    if (watchId) {
      navigate({
        to: "/watch/$id",
        params: { id: watchId },
      });
      return;
    }

    navigate({
      to: "/add",
      search: { url } as never,
    });
  };

  const src = proxySrc;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl screen-safe">
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 truncate rounded-full bg-card px-4 py-2 text-center text-xs text-muted-foreground">
            {host}
          </div>

          <button
            type="button"
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

      <div className="relative flex-1">
        {proxyError ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted-foreground">{proxyError}</p>
          </div>
        ) : null}

        {!ready && !proxyError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading {host}…</p>
          </div>
        )}

        {src ? (
          <iframe
            ref={iframeRef}
            src={src}
            title={`Preview of ${host}`}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            className="h-[calc(100vh-64px)] w-full border-0 bg-white"
            onLoad={() => {
              // Fallback if picker postMessage is delayed/blocked.
              setReady(true);
            }}
          />
        ) : null}
      </div>

      {!picking && !selection && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md flex-col items-stretch gap-2 px-4 pb-5 screen-safe">
          <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 px-3 py-2 text-center text-[11px] text-muted-foreground backdrop-blur">
            Preview is a snapshot (some shops look frozen). Tap Highlight, or{" "}
            <button
              type="button"
              className="font-semibold text-primary"
              onClick={() =>
                navigate({
                  to: "/setup",
                  search: { url, intent: "paste" },
                })
              }
            >
              paste text
            </button>
            {" · "}
            <button
              type="button"
              className="font-semibold text-primary"
              onClick={() =>
                navigate({
                  to: "/setup",
                  search: { url, intent: "page" },
                })
              }
            >
              watch whole page
            </button>
          </div>
          <button
            type="button"
            onClick={enablePicking}
            className="pointer-events-auto flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/40 glow-ring transition active:scale-95"
          >
            <MousePointerClick className="h-5 w-5" strokeWidth={2.6} />
            {watchId ? "Change selection" : "Highlight"}
          </button>
        </div>
      )}

      {picking && !selection && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-center px-4 pb-5 screen-safe">
          <button
            type="button"
            onClick={exitPicking}
            className="pointer-events-auto flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold shadow-xl transition active:scale-95"
          >
            <Check className="h-4 w-4" />
            Done
          </button>
        </div>
      )}

      {selection && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={saveState === "idle" ? dismissSheet : undefined}
          />

          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-3 pb-3 screen-safe">
            <div className="rounded-[28px] border border-border bg-card/98 p-5 shadow-2xl backdrop-blur-2xl animate-scale-in">
              <div className="flex items-start gap-3">
                <img src={rinja} alt="" className="h-14 w-14 flex-shrink-0 object-contain" />

                <div className="flex-1 pt-1">
                  <p className="text-[11px] uppercase tracking-widest text-primary">
                    {kindLabel(kind)}
                  </p>

                  <h3 className="mt-1 text-[19px] font-semibold leading-snug tracking-tight">
                    {watchId ? "Update what I should watch?" : "Should I keep an eye on this?"}
                  </h3>
                </div>
              </div>

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

              <div className="mt-4 flex flex-wrap gap-2">
                {options.map((option) => {
                  const active = mode === option.value;

                  return (
                    <button
                      type="button"
                      key={option.value}
                      disabled={saveState !== "idle"}
                      onClick={() => setMode(option.value)}
                      className={`flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${
                        active
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-background/40 text-foreground/80 hover:bg-background/70"
                      }`}
                    >
                      <option.icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={saveState !== "idle"}
                onClick={() => setNotify((value) => !value)}
                className={`mt-4 flex h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left transition ${
                  notify ? "border-primary/40 bg-primary/10" : "border-border bg-background/40"
                }`}
              >
                {notify ? (
                  <Bell className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1">
                  <span className="block text-[13px] font-medium">
                    {notify ? "Alerts on" : "Alerts off"}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {notify
                      ? "I'll notify you when this changes"
                      : "I'll watch quietly — no alerts"}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={save}
                disabled={saveState !== "idle"}
                className={`mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.98] ${
                  saveState === "done"
                    ? "bg-primary/20 text-primary"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                }`}
              >
                {saveState === "idle" && (watchId ? "Update watch" : "Yes")}

                {saveState === "saving" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {watchId ? "Updating…" : "Watching…"}
                  </>
                )}

                {saveState === "done" && (
                  <>
                    <Check className="h-4 w-4" strokeWidth={3} />
                    {watchId ? "Updated" : "I'm watching"}
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
        className="h-14 w-14 rounded-xl border border-border/60 object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
      <p className="truncate text-[13px] text-muted-foreground">Image</p>
    </div>
  );
}

type Option = {
  value: WatchMode;
  label: string;
  icon: typeof Type;
};

function optionsFor(kind: ElementKind): Option[] {
  const options: Option[] = [];

  if (kind === "price" || kind === "stock") {
    // Keep mode for compare heuristics, but don't promise dedicated stock/price APIs.
    options.push({
      value: kind === "price" ? "price" : "stock",
      label: "This text",
      icon: Type,
    });
  } else if (kind === "image") {
    options.push({
      value: "image",
      label: "Image",
      icon: ImageIcon,
    });
  } else {
    options.push({
      value: "text",
      label: "Text",
      icon: Type,
    });
  }

  options.push({
    value: "any",
    label: "Any change",
    icon: Sparkles,
  });

  options.push({
    value: "custom",
    label: "Custom…",
    icon: Settings2,
  });

  return options;
}
