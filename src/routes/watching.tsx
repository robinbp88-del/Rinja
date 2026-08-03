import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { RinjaMascot } from "../components/RinjaMascot";
import { requireAuth } from "../lib/requireAuth";
import { watchConditionLabel } from "../lib/watch-labels";
import { getWatchById } from "../lib/watches";

const searchSchema = z.object({
  id: z.string().min(1),
});

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
          I&apos;ll let you know when something changes.
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
