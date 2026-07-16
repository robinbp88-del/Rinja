import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp, ChevronRight, TrendingDown, Bell } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { useStore } from "../lib/store";
import { RinjaMascot } from "../components/RinjaMascot";
import binoculars from "../assets/binoculars.png";

export const Route = createFileRoute("/home")({
  component: Home,
});

const SUGGESTIONS = [
  "RTX 5090",
  "Nike Air Max 42",
  "House in Bergen",
  "Coldplay tickets",
];

function timeAgo(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function Home() {
  const navigate = useNavigate();
  const { user, watches, events } = useStore();
  const [query, setQuery] = useState("");

  const submit = () => {
    const q = query.trim();
    if (!q) return;
    if (/^https?:\/\//i.test(q)) {
      navigate({ to: "/add", search: { url: q } as any });
    } else {
      navigate({ to: "/search", search: { q } as any });
    }
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen pb-32">
      {/* Top row: mascot + profile */}
      <header className="flex items-start justify-between px-6 pt-16 screen-safe">
        <RinjaMascot variant="idle" size={310} priority className="-ml-6 -mt-6 shrink-0" />
        <Link
          to="/profile"
          aria-label="Profile"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-primary"
        >
          {(user?.name?.[0] ?? "Y").toUpperCase()}
        </Link>
      </header>

      {/* Heading */}
      <section className="mt-10 px-6">
        <h1 className="text-[36px] font-semibold leading-[1.1] tracking-tight">
          What should I keep an eye on?
        </h1>
      </section>

      {/* Search field */}
      <section className="mt-10 px-6">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card pl-5 pr-2 py-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Search or paste a webpage URL..."
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
          />
          <button
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

        {/* Suggestion chips */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setQuery(suggestion)}
              className="rounded-full border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      {/* Watching for you */}
      <section className="mt-14 px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold tracking-tight">Watching for you</h2>
          {watches.length > 3 && (
            <Link to="/search" search={{} as any} className="text-xs text-primary">
              See all
            </Link>
          )}
        </div>

        {watches.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
            <img
              src={binoculars}
              alt=""
              width={80}
              height={80}
              loading="lazy"
              className="mx-auto h-20 w-20 opacity-90"
            />
            <p className="mt-4 text-[15px] font-medium">I'm ready.</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Tell me what to watch.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {watches.slice(0, 4).map((w) => {
              const latest = events.find((e) => e.watchId === w.id);
              const changed = latest && latest.title !== "Now watching";
              return (
                <Link
                  key={w.id}
                  to="/watch/$id"
                  params={{ id: w.id }}
                  className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 transition active:scale-[0.99]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-[13px] font-semibold text-primary">
                    {w.host.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{w.label}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {w.paused ? (
                        <span className="text-[12px] text-muted-foreground">Paused</span>
                      ) : changed ? (
                        <>
                          <TrendingDown className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[12px] font-medium text-primary">
                            {latest!.title}
                          </span>
                        </>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">No changes</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      Checked {timeAgo(latest?.createdAt ?? w.createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent alerts hint */}
      {events.some((e) => !e.read) && (
        <section className="mt-8 px-6">
          <Link
            to="/notifications"
            className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3.5"
          >
            <Bell className="h-4 w-4 text-primary" />
            <span className="flex-1 text-[13px] font-medium">You have new alerts</span>
            <ChevronRight className="h-4 w-4 text-primary" />
          </Link>
        </section>
      )}

      <BottomNav />
    </div>
  );
}
