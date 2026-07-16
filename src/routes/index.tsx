import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { onboarded } = useStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      navigate({ to: onboarded ? "/home" : "/welcome", replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [ready, onboarded, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-3xl" />
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/60 shadow-2xl">
          <Eye className="h-10 w-10 text-primary-foreground" strokeWidth={2.4} />
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">WatchPage</h1>
        <p className="mt-1 text-sm text-muted-foreground">Never miss what matters.</p>
      </div>
    </div>
  );
}
