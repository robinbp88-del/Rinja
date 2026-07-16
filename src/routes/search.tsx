import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Eye, Search as SearchIcon } from "lucide-react";
import { z } from "zod";

import { BottomNav } from "../components/BottomNav";
import { useStore, hostFromUrl } from "../lib/store";
import { isUrl, type SearchResponse, type SearchResult } from "../lib/search";
import { intelligentSearch } from "../lib/search.functions";
import { useServerFn } from "@tanstack/react-start";

import { RinjaMascot } from "../components/RinjaMascot";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: (s) => searchSchema.parse(s),
  component: SearchPage,
});

const INTENT_LABEL: Record<string, string> = {
  product: "Products",
  house: "Homes",
  job: "Jobs",
  ticket: "Tickets",
  travel: "Trips",
  price: "Prices",
  availability: "Availability",
  general: "Results",
};

function availabilityText(r: SearchResult): { label: string; tone: "ok" | "warn" | "out" } | null {
  switch (r.availability) {
    case "in_stock":
      return { label: "In stock", tone: "ok" };
    case "limited":
      return { label: r.meta ?? "Limited", tone: "warn" };
    case "out_of_stock":
      return { label: "Out of stock", tone: "out" };
    default:
      return r.meta ? { label: r.meta, tone: "ok" } : null;
  }
}

const SIGNALS: Record<string, string[]> = {
  product: ["Price changes", "Stock changes"],
  price: ["Price changes"],
  availability: ["Stock changes"],
  ticket: ["Price changes", "New listings"],
  house: ["Price changes", "New listings"],
  job: ["New listings"],
  travel: ["Price changes"],
  general: ["Any changes"],
};

function ResultCard({
  r,
  tracked,
  glowing,
  onTrack,
}: {
  r: SearchResult;
  tracked: boolean;
  glowing: boolean;
  onTrack: () => void;
}) {
  const avail = availabilityText(r);
  void SIGNALS;
  return (
    <div
      className={`rounded-3xl border bg-card p-4 transition-all duration-500 ${
        glowing
          ? "border-primary/60 shadow-[0_0_0_4px_oklch(0.58_0.24_295_/_0.18),0_0_32px_oklch(0.58_0.24_295_/_0.45)]"
          : "border-border shadow-none"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/15 text-[13px] font-semibold text-primary">
          {r.image ? (
            <img src={r.image} alt="" className="h-full w-full object-cover" />
          ) : (
            r.source.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{r.title}</p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {r.source}
            {r.country ? ` · ${r.country}` : ""}
          </p>
          {avail && (
            <p
              className={`mt-1 text-[11px] font-medium uppercase tracking-widest ${
                avail.tone === "ok"
                  ? "text-primary"
                  : avail.tone === "warn"
                    ? "text-amber-400"
                    : "text-muted-foreground"
              }`}
            >
              {avail.label}
            </p>
          )}
        </div>
        {r.price && (
          <p
            className={`text-right text-[18px] font-semibold tabular-nums ${
              r.availability === "out_of_stock" ? "text-muted-foreground line-through" : ""
            }`}
          >
            {r.price}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-semibold transition active:scale-[0.98] hover:border-primary/40"
        >
          <ExternalLink className="h-4 w-4" /> Open
        </a>
        <button
          onClick={onTrack}
          disabled={tracked}
          className={`relative flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-300 active:scale-[0.98] ${
            tracked
              ? "border border-primary/40 bg-primary/10 text-primary"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {tracked ? (
            <>
              <Check className="h-4 w-4 animate-scale-in" strokeWidth={2.8} /> Watching
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" strokeWidth={2.6} /> Track
            </>
          )}
          {glowing && (
            <span aria-hidden className="pointer-events-none absolute inset-0">
              <span
                className="absolute left-3 top-2 h-1.5 w-1.5 rounded-full bg-primary"
                style={{ animation: "rinja-sparkle 900ms ease-out forwards", ["--sx" as any]: "-12px", ["--sy" as any]: "-18px" }}
              />
              <span
                className="absolute right-4 top-3 h-1 w-1 rounded-full bg-primary"
                style={{ animation: "rinja-sparkle 900ms ease-out 120ms forwards", ["--sx" as any]: "14px", ["--sy" as any]: "-14px" }}
              />
              <span
                className="absolute right-6 bottom-2 h-1 w-1 rounded-full bg-primary"
                style={{ animation: "rinja-sparkle 900ms ease-out 220ms forwards", ["--sx" as any]: "10px", ["--sy" as any]: "16px" }}
              />
            </span>
          )}
        </button>
      </div>

      {tracked && (
        <p className="mt-3 text-[12px] font-medium text-primary animate-fade-in">
          I'll keep an eye on it.
        </p>
      )}
    </div>
  );
}

const THINKING_STEPS = [
  "Looking around…",
  "Checking prices…",
  "Comparing stores…",
  "Almost there…",
];

function LoadingState() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % THINKING_STEPS.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mt-16 flex flex-col items-center px-6 text-center">
      {/* Dot Rinja follows — matches binocular scan period (2.4s) */}
      <div
        aria-hidden
        className="relative h-6 w-[220px]"
      >
        <span
          className="absolute top-1/2 left-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary"
          style={{
            boxShadow: "0 0 12px 4px oklch(0.58 0.24 295 / 0.65)",
            animation: "rinja-dot 2.4s ease-in-out infinite",
          }}
        />
      </div>
      <RinjaMascot variant="binoculars" size={160} className="-mt-2" />
      <p
        key={step}
        className="mt-6 min-h-[22px] text-[15px] font-medium animate-fade-in"
      >
        {THINKING_STEPS[step]}
      </p>
    </div>
  );
}

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const navigate = useNavigate();
  const { addWatch } = useStore();
  const search = useServerFn(intelligentSearch);

  const [q, setQ] = useState(initialQ ?? "");
  const [submittedQ, setSubmittedQ] = useState(initialQ ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [tracked, setTracked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const query = submittedQ.trim();
    if (!query) {
      setResponse(null);
      return;
    }
    if (isUrl(query)) {
      navigate({ to: "/add", search: { url: query } as any });
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResponse(null);
    search({ data: { query } })
      .then((res) => {
        if (cancelled) return;
        setResponse(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submittedQ, navigate, search]);

  const submit = () => setSubmittedQ(q);

  const [glowing, setGlowing] = useState<Set<string>>(new Set());

  const naturalEvent = (r: SearchResult, host: string) => {
    switch (r.intent) {
      case "product":
        return `👀 Rinja is now watching ${r.title} on ${r.source}. I'll let you know when the price or stock changes.`;
      case "price":
        return `👀 Watching ${r.title}. I'll ping you when the price moves.`;
      case "availability":
        return `👀 I'll tell you when ${r.title} is back in stock.`;
      case "ticket":
        return `👀 You're now following ${r.title}. I'll ping you when tickets or prices change.`;
      case "house":
        return `👀 Watching homes like ${r.title}. I'll tell you when new listings appear.`;
      case "job":
        return `👀 Watching for new roles like ${r.title}.`;
      case "travel":
        return `👀 Watching ${r.title}. I'll let you know when the price changes.`;
      default:
        return `👀 Rinja is now watching ${r.title} on ${host}.`;
    }
  };

  const track = (r: SearchResult) => {
    const host = hostFromUrl(r.url);
    addWatch(
      {
        url: r.url,
        host,
        title: `${r.source} · ${r.title}`,
        label: r.title,
        currentValue: r.price ?? (r.availability === "out_of_stock" ? "Out of stock" : "Watching"),
        frequency: "15m",
      } as any,
      { eventTitle: "Now watching", eventBody: naturalEvent(r, host) },
    );
    setTracked((s) => new Set(s).add(r.id));
    setGlowing((s) => new Set(s).add(r.id));
    // Light haptic on supported devices
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.(12); } catch {}
    }
    setTimeout(() => {
      setGlowing((s) => {
        const next = new Set(s);
        next.delete(r.id);
        return next;
      });
    }, 1100);
  };

  const heading = response ? INTENT_LABEL[response.intent] ?? "Results" : "Search";

  return (
    <div className="min-h-screen pb-32">
      <header className="px-6 pt-10 screen-safe">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/home" })}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-[26px] font-semibold tracking-tight">{heading}</h1>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Search or paste a webpage URL…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </header>

      {loading && <LoadingState />}

      {!loading && error && (
        <section className="mt-16 px-6 text-center">
          <p className="text-[15px] font-semibold">Rinja hit a snag.</p>
          <p className="mt-2 text-[13px] text-muted-foreground">{error}</p>
        </section>
      )}

      {!loading && !error && response && response.results.length > 0 && (
        <section className="mt-8 px-6">
          <p className="text-[15px] font-medium">I found these.</p>
          <div className="mt-4 space-y-3">
            {response.results.map((r) => (
              <ResultCard
                key={r.id}
                r={r}
                tracked={tracked.has(r.id)}
                glowing={glowing.has(r.id)}
                onTrack={() => track(r)}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && response && response.results.length === 0 && (
        <section className="mt-16 px-6 text-center">
          <p className="text-[17px] font-semibold">I couldn't find anything yet.</p>
          <p className="mt-2 text-[13px] text-muted-foreground">Try one of these instead.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {response.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQ(s);
                  setSubmittedQ(s);
                }}
                className="rounded-full border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {!loading && !response && (
        <section className="mt-10 flex flex-col items-center px-6 text-center">
          <RinjaMascot variant="laptop" size={200} />
          <p className="mt-4 text-sm text-muted-foreground">What should I keep an eye on?</p>
        </section>
      )}

      <BottomNav />
    </div>
  );
}
