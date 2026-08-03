import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUp,
  ChevronRight,
  Bell,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { BottomNav } from "../components/BottomNav";
import { RinjaMascot } from "../components/RinjaMascot";
import { getWatches, watchStatusLine } from "../lib/watches";
import { getUnreadNotificationCount } from "../lib/notifications";
import { useAuth } from "../providers/AuthProvider";
import { requireAuth } from "../lib/requireAuth";
import binoculars from "../assets/binoculars.png";

export const Route = createFileRoute("/home")({
  beforeLoad: requireAuth,
  component: Home,
});

const SUGGESTIONS = [
  { label: "Amazon", url: "https://www.amazon.com/" },
  { label: "Finn.no", url: "https://www.finn.no/" },
  { label: "Ticketmaster", url: "https://www.ticketmaster.com/" },
  { label: "Apple", url: "https://www.apple.com/" },
  { label: "Nike", url: "https://www.nike.com/" },
  { label: "Steam", url: "https://store.steampowered.com/" },
  { label: "Booking", url: "https://www.booking.com/" },
  { label: "eBay", url: "https://www.ebay.com/" },
];

function timeAgo(value: string | number | null | undefined) {
  if (!value) return "not checked yet";

  const timestamp =
    typeof value === "number" ? value : new Date(value).getTime();

  if (Number.isNaN(timestamp)) return "recently";

  const seconds = Math.max(
    1,
    Math.floor((Date.now() - timestamp) / 1000),
  );

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function Home() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [query, setQuery] = useState("");

  const watchesQuery = useQuery({
    queryKey: ["watches", authUser?.id],
    queryFn: getWatches,
    enabled: Boolean(authUser),
  });

  const alertsQuery = useQuery({
    queryKey: ["notifications", "unread", authUser?.id],
    queryFn: getUnreadNotificationCount,
    enabled: Boolean(authUser),
    refetchInterval: 60_000,
  });

  const watches = watchesQuery.data ?? [];
  const unreadAlerts = alertsQuery.data ?? 0;

  const displayName =
    authUser?.user_metadata?.name ??
    authUser?.email?.split("@")[0] ??
    "You";

  const profileInitial = displayName.charAt(0).toUpperCase();

  const submit = () => {
    const value = query.trim();
    if (!value) return;

    if (/^https?:\/\//i.test(value)) {
      navigate({
        to: "/add",
        search: { url: value } as never,
      });
      return;
    }

    navigate({
      to: "/search",
      search: { q: value } as never,
    });
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen pb-32">
      <header className="flex items-start justify-between px-6 pt-16 screen-safe">
        <RinjaMascot
          variant="guard"
          mood="curious"
          size={220}
          priority
          className="-ml-2 -mt-2 shrink-0"
        />

        <Link
          to="/profile"
          aria-label="Profile"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-primary"
        >
          {profileInitial}
        </Link>
      </header>

      <section className="mt-10 px-6">
        <h1 className="text-[36px] font-semibold leading-[1.1] tracking-tight">
          What should I keep an eye on?
        </h1>
        <p className="mt-3 text-[14px] leading-snug text-muted-foreground">
          1) Paste a URL · 2) Tap what matters · 3) I’ll alert you on change
        </p>
      </section>

      <section className="mt-8 px-6">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card py-2 pl-5 pr-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Paste a webpage URL..."
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
          />

          <button
            type="button"
            onClick={submit}
            aria-label="Send"
            disabled={!hasQuery}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 active:scale-95 ${
              hasQuery
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
          </button>
        </div>

        <p className="mt-4 text-[12px] text-muted-foreground">
          Popular sites people watch for updates
        </p>

        <div className="mt-3 flex flex-wrap gap-2.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              type="button"
              key={suggestion.url}
              onClick={() =>
                navigate({
                  to: "/add",
                  search: { url: suggestion.url } as never,
                })
              }
              className="rounded-full border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-14 px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-semibold tracking-tight">
            Watching for you
            {watches.length > 0 ? (
              <span className="ml-2 text-[13px] font-medium text-muted-foreground">
                {watches.length}
              </span>
            ) : null}
          </h2>

          <div className="flex items-center gap-1">
            <Link
              to="/add"
              className="rounded-full px-3 py-1.5 text-[12px] font-medium text-primary"
            >
              Add
            </Link>
            <button
              type="button"
              onClick={() => watchesQuery.refetch()}
              disabled={watchesQuery.isFetching}
              aria-label="Refresh watches"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-card hover:text-primary disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  watchesQuery.isFetching ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {watchesQuery.isLoading ? (
          <div className="mt-6 flex min-h-36 items-center justify-center rounded-3xl border border-border bg-card/40">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading watches…
            </div>
          </div>
        ) : watchesQuery.isError ? (
          <div className="mt-6 rounded-3xl border border-destructive/40 bg-destructive/10 p-6 text-center">
            <p className="text-sm font-medium">
              I couldn't load your watches.
            </p>

            <button
              type="button"
              onClick={() => watchesQuery.refetch()}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Try again
            </button>
          </div>
        ) : watches.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center">
            <img
              src={binoculars}
              alt=""
              width={80}
              height={80}
              loading="lazy"
              className="mx-auto h-20 w-20 opacity-90"
            />

            <p className="mt-4 text-[15px] font-medium">Nothing on my list yet.</p>

            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Paste a URL above, open the page, tap the price or text you care
              about — then I’ll watch it for you.
            </p>

            <button
              type="button"
              onClick={() => navigate({ to: "/add" })}
              className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Add your first watch
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {watches.map((watch) => (
              <Link
                key={watch.id}
                to="/watch/$id"
                params={{ id: watch.id }}
                className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 transition active:scale-[0.99]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-[13px] font-semibold text-primary">
                  {(watch.host ?? "WE").slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    {watch.label}
                  </p>

                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {watchStatusLine(watch)}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    Checked{" "}
                    {timeAgo(watch.last_checked ?? watch.created_at)}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {unreadAlerts > 0 && (
        <section className="mt-8 px-6">
          <Link
            to="/notifications"
            className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3.5"
          >
            <Bell className="h-4 w-4 text-primary" />

            <span className="flex-1 text-[13px] font-medium">
              You have {unreadAlerts} new alert{unreadAlerts === 1 ? "" : "s"}
            </span>

            <ChevronRight className="h-4 w-4 text-primary" />
          </Link>
        </section>
      )}

      <BottomNav />
    </div>
  );
}