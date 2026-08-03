import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Eye, Search as SearchIcon } from "lucide-react";
import { z } from "zod";

import { BottomNav } from "../components/BottomNav";
import { isUrl, type SearchResponse, type SearchResult } from "../lib/search";
import { intelligentSearch } from "../lib/search.functions";
import { useServerFn } from "@tanstack/react-start";

import { RinjaMascot } from "../components/RinjaMascot";
import { requireAuth } from "../lib/requireAuth";
import { supabase } from "../lib/supabase";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  beforeLoad: requireAuth,
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
  onTrack,
}: {
  r: SearchResult;
  onTrack: () => void;
}) {
  const avail = availabilityText(r);
  void SIGNALS;
  return (
    <div className="rounded-3xl border border-border bg-card p-4 transition-all duration-500">
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
          className="relative flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all duration-300 active:scale-[0.98]"
        >
          <Eye className="h-4 w-4" strokeWidth={2.6} /> Track
        </button>
      </div>
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
      <RinjaMascot variant="binoculars" mood="curious" size={168} className="-mt-2" />
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
  const search = useServerFn(intelligentSearch);

  const [q, setQ] = useState(initialQ ?? "");
  const [submittedQ, setSubmittedQ] = useState(initialQ ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);

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

    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Not signed in");
        }
        const res = await search({
          data: { query, accessToken: session.access_token },
        });
        if (cancelled) return;
        setResponse(res);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [submittedQ, navigate, search]);

  const submit = () => setSubmittedQ(q);

  const track = (r: SearchResult) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(12);
      } catch {}
    }

    navigate({
      to: "/highlight",
      search: { url: r.url } as never,
    });
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
          <RinjaMascot variant="laptop" mood="thinking" size={200} />
          <p className="mt-4 text-sm text-muted-foreground">What should I keep an eye on?</p>
        </section>
      )}

      <BottomNav />
    </div>
  );
}
