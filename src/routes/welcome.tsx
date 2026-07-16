import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Apple } from "lucide-react";
import { useStore } from "../lib/store";
import { RinjaMascot } from "../components/RinjaMascot";

export const Route = createFileRoute("/welcome")({
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const { completeOnboarding } = useStore();

  const signInGoogle = () => {
    // Mocked auth. Real Google/Apple sign-in comes with Supabase.
    completeOnboarding({
      name: "You",
      email: "you@example.com",
      interests: [],
    });
    navigate({ to: "/interests" });
  };

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 pt-12 screen-safe">
      <div className="flex flex-col items-center text-center pt-6">
        <RinjaMascot variant="idle" size={130} className="mb-14" priority />
        <h1 className="text-[38px] font-bold leading-[1.1] tracking-tight">
          Never miss<br />what matters.
        </h1>
        <p className="mt-8 max-w-xs text-[17px] leading-snug text-muted-foreground">
          Watch any webpage.<br />Get notified when it changes.
        </p>
      </div>

      <div className="flex flex-col gap-3 pb-10">
        <button
          onClick={signInGoogle}
          className="group relative flex h-13 items-center justify-center gap-3 rounded-full bg-foreground text-sm font-semibold text-background transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.96]"
        >
          <GoogleG /> Continue with Google
        </button>
        <button
          onClick={signInGoogle}
          className="group relative flex h-13 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-semibold text-foreground transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 hover:bg-card/80 hover:shadow-lg active:scale-[0.96]"
        >
          <Apple className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" /> Continue with Apple
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
