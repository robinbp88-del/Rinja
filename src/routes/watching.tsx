import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, ChevronRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { RinjaMascot } from "../components/RinjaMascot";
import { requireAuth } from "../lib/requireAuth";
import { watchConditionLabel } from "../lib/watch-labels";
import { getWatchById } from "../lib/watches";
import {
  enablePushNotifications,
  hasActivePushSubscription,
  pushSupported,
} from "../lib/push-client";

const searchSchema = z.object({
  id: z.string().min(1),
});

const PUSH_DISMISS_KEY = "rinja.pushPrompt.dismissed";

export const Route = createFileRoute("/watching")({
  beforeLoad: requireAuth,
  validateSearch: (s) => searchSchema.parse(s),
  component: WatchingSuccessPage,
});

function WatchingSuccessPage() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();

  const watchQuery = useQuery({
    queryKey: ["watch", id],
    queryFn: () => getWatchById(id),
  });

  const watch = watchQuery.data;

  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!pushSupported()) return;
      if (localStorage.getItem(PUSH_DISMISS_KEY) === "1") return;
      const active = await hasActivePushSubscription();
      if (!cancelled && !active) setShowPushPrompt(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enablePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    setPushMessage("");
    try {
      const res = await enablePushNotifications();
      if (!res.ok) {
        setPushMessage(res.error ?? "Could not enable push.");
        return;
      }
      setShowPushPrompt(false);
      setPushMessage("Push on — you’ll get lock-screen alerts.");
    } finally {
      setPushBusy(false);
    }
  };

  const dismissPush = () => {
    localStorage.setItem(PUSH_DISMISS_KEY, "1");
    setShowPushPrompt(false);
  };

  return (
    <div className="flex min-h-screen flex-col px-6 pt-6 screen-safe">
      <button
        type="button"
        onClick={() => navigate({ to: "/home" })}
        aria-label="Back to overview"
        className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="relative mx-auto mt-2 flex w-full max-w-sm flex-col items-center">
        <RinjaMascot
          variant="secure"
          mood="happy"
          size={220}
          priority
          flat
          className="overflow-visible"
        />
        <div
          aria-hidden
          className="absolute right-[18%] top-[12%] flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="mt-2 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight">
          I&apos;m watching!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          I&apos;ll check the page on a schedule and alert you when that
          highlighted text changes in the page HTML.
        </p>
      </div>

      {watchQuery.isLoading ? (
        <div className="mt-8 flex justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : watchQuery.isError || !watch ? (
        <p className="mt-8 text-center text-sm text-destructive">
          Watch created, but I couldn&apos;t load the summary.
        </p>
      ) : (
        <div className="mt-8 rounded-3xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-sm font-semibold text-primary">
              {(watch.host ?? "WE").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{watch.label}</p>
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                {watch.host ?? "webpage"}
              </p>
              <p className="mt-2 text-[13px] text-primary">
                {watchConditionLabel(watch)}
              </p>
            </div>
          </div>
        </div>
      )}

      {showPushPrompt ? (
        <div className="mt-4 rounded-3xl border border-primary/35 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Get lock-screen alerts</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Turn on push so you notice changes even when Rinja is closed.
                Best from the installed home-screen app.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={pushBusy}
                  onClick={() => void enablePush()}
                  className="flex h-10 flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {pushBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enable push"
                  )}
                </button>
                <button
                  type="button"
                  disabled={pushBusy}
                  onClick={dismissPush}
                  className="flex h-10 flex-1 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold"
                >
                  Not now
                </button>
              </div>
              {pushMessage ? (
                <p className="mt-2 text-[12px] text-destructive">{pushMessage}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : pushMessage ? (
        <p className="mt-4 text-center text-[13px] text-primary">{pushMessage}</p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pb-8 pt-8">
        {watch ? (
          <Link
            to="/watch/$id"
            params={{ id: watch.id }}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-semibold"
          >
            See details
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => navigate({ to: "/home" })}
          className="flex h-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        >
          Back to overview
        </button>
      </div>
    </div>
  );
}
