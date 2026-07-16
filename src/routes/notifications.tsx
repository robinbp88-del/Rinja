import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { useStore } from "../lib/store";
import { RinjaMascot } from "../components/RinjaMascot";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
});

const STATUS_LINES = ["I'm watching.", "Nothing new yet."];

function Notifications() {
  const { events, markAllRead } = useStore();
  const [line, setLine] = useState(0);

  useEffect(() => {
    markAllRead();
  }, []); // eslint-disable-line

  useEffect(() => {
    const id = setInterval(() => {
      setLine((s) => (s + 1) % STATUS_LINES.length);
    }, 3600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen pb-32">
      <header className="flex items-baseline justify-between px-6 pt-12 screen-safe">
        <h1 className="text-[28px] font-semibold tracking-tight">Alerts</h1>
      </header>

      {/* Rinja at laptop */}
      <section className="mt-4 flex flex-col items-center px-6 text-center">
        <RinjaMascot variant="laptop" size={168} />
        <p
          key={events.length === 0 ? "empty" : line}
          className="mt-2 text-[14px] font-medium animate-fade-in"
        >
          {events.length === 0 ? "Everything looks quiet." : STATUS_LINES[line]}
        </p>
      </section>

      <div className="mt-6 px-6">
        {events.length === 0 ? null : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{e.title}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{e.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
