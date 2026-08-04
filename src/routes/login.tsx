import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp } from "../lib/auth";
import { toUserError } from "../lib/user-errors";
import { RinjaMascot } from "../components/RinjaMascot";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();

  const [registerMode, setRegisterMode] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    try {
      setLoading(true);
      setError("");

      if (registerMode) {
        const data = await signUp(email, password, name);
        if (!data.session) {
          setPendingConfirm(true);
          return;
        }
      } else {
        await signIn(email, password);
      }

      navigate({ to: "/home", replace: true });
    } catch (err: unknown) {
      setError(toUserError(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-6 pt-6 screen-safe">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.45 0.18 295 / 0.45), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, oklch(0.35 0.12 260 / 0.25), transparent 60%)",
        }}
      />

      <button
        type="button"
        onClick={() => navigate({ to: "/welcome" })}
        aria-label="Back"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-col items-center text-center">
          <RinjaMascot
            variant={registerMode || pendingConfirm ? "secure" : "hero"}
            mood={registerMode || pendingConfirm ? "happy" : "neutral"}
            size={128}
            priority
            flat
          />
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
            Rinja
          </p>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">
            {pendingConfirm
              ? "Check your email"
              : registerMode
                ? "Create your account"
                : "Welcome back"}
          </h1>
          <p className="mt-2 max-w-xs text-[14px] text-muted-foreground">
            {pendingConfirm
              ? `We sent a confirmation link to ${email}. Open it, then come back and sign in.`
              : registerMode
                ? "Create an account with email, or go back and use Google."
                : "Sign in with email, or go back and use Google."}
          </p>
        </div>

        {pendingConfirm ? (
          <div className="mt-auto flex flex-col gap-3 pb-8 pt-8">
            <button
              type="button"
              onClick={() => {
                setPendingConfirm(false);
                setRegisterMode(false);
                setError("");
              }}
              className="flex h-13 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[0.98]"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-3">
              {registerMode && (
                <label className="block">
                  <span className="mb-1.5 block px-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                    Name
                  </span>
                  <input
                    className="h-12 w-full rounded-2xl border border-border bg-card/80 px-4 text-[15px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Your name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block px-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                  Email
                </span>
                <input
                  className="h-12 w-full rounded-2xl border border-border bg-card/80 px-4 text-[15px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  placeholder="you@email.com"
                  type="email"
                  inputMode="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block px-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                  Password
                </span>
                <div className="relative">
                  <input
                    className="h-12 w-full rounded-2xl border border-border bg-card/80 px-4 pr-12 text-[15px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    autoComplete={registerMode ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-[13px] text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-auto flex flex-col gap-3 pb-8 pt-8">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={loading || !email.trim() || !password.trim()}
                className="flex h-13 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[0.98] disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait…
                  </>
                ) : registerMode ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisterMode(!registerMode);
                  setError("");
                }}
                className="h-11 text-[13px] text-muted-foreground transition hover:text-foreground"
              >
                {registerMode ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
