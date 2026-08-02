import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useStore } from "../lib/store";
import { requireAuth } from "../lib/requireAuth";

export const Route = createFileRoute("/interests")({
  beforeLoad: requireAuth,
  component: Interests,
});

const OPTIONS = [
  "Shopping", "Sneakers", "Crypto", "Stocks",
  "Gaming", "Travel", "News", "Tickets", "Technology",
];

function Interests() {
  const navigate = useNavigate();
  const { setInterests } = useStore();
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (o: string) =>
    setPicked((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));

  return (
    <div className="flex min-h-screen flex-col px-6 pt-16 screen-safe">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Step 2 of 2
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          What do you care about?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We'll tailor recommendations. Skip anytime.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {OPTIONS.map((o) => {
          const active = picked.includes(o);
          return (
            <button
              key={o}
              onClick={() => toggle(o)}
              className={`rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-muted-foreground/40"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2 pb-8">
        <button
          onClick={() => { setInterests(picked); navigate({ to: "/home" }); }}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setInterests([]); navigate({ to: "/home" }); }}
          className="h-11 text-sm text-muted-foreground"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
