import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type WatchMode = "price" | "stock" | "text" | "image" | "any" | "custom";

export type Watch = {
  id: string;
  url: string;
  host: string;
  title: string;
  label: string;
  currentValue: string;
  selector?: string;
  mode?: WatchMode;
  frequency: "5m" | "15m" | "1h" | "6h" | "1d";
  paused: boolean;
  createdAt: number;
};

export type ChangeEvent = {
  id: string;
  watchId: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
};

export type User = {
  name: string;
  email: string;
  avatar?: string;
  interests: string[];
};

type State = {
  onboarded: boolean;
  user: User | null;
  watches: Watch[];
  events: ChangeEvent[];
};

type Ctx = State & {
  completeOnboarding: (user: User) => void;
  setInterests: (i: string[]) => void;
  addWatch: (
    w: Omit<Watch, "id" | "createdAt" | "paused">,
    opts?: { eventTitle?: string; eventBody?: string },
  ) => Watch;
  removeWatch: (id: string) => void;
  togglePause: (id: string) => void;
  markAllRead: () => void;
  logout: () => void;
};

const KEY = "watchpage.state.v1";

const initial: State = {
  onboarded: false,
  user: null,
  watches: [],
  events: [],
};

// Seed demo events (only if there are watches — computed lazily elsewhere)
const StoreContext = createContext<Ctx | null>(null);
function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state, hydrated]);

  const value = useMemo<Ctx>(() => ({
    ...state,
    completeOnboarding: (user) =>
      setState((s) => ({ ...s, onboarded: true, user })),
    setInterests: (interests) =>
      setState((s) => ({ ...s, user: s.user ? { ...s.user, interests } : s.user })),
    addWatch: (w, opts) => {
      const watch: Watch = {
        ...w,
        id: createId(),
        createdAt: Date.now(),
        paused: false,
      };
      setState((s) => ({
        ...s,
        watches: [watch, ...s.watches],
        events: [
          {
            id: createId(),
            watchId: watch.id,
            title: opts?.eventTitle ?? "Now watching",
            body:
              opts?.eventBody ??
              `👀 Rinja is now watching ${watch.label} on ${watch.host}.`,
            createdAt: Date.now(),
            read: false,
          },
          ...s.events,
        ],
      }));
      return watch;
    },
    removeWatch: (id) =>
      setState((s) => ({
        ...s,
        watches: s.watches.filter((w) => w.id !== id),
        events: s.events.filter((e) => e.watchId !== id),
      })),
    togglePause: (id) =>
      setState((s) => ({
        ...s,
        watches: s.watches.map((w) => (w.id === id ? { ...w, paused: !w.paused } : w)),
      })),
    markAllRead: () =>
      setState((s) => ({ ...s, events: s.events.map((e) => ({ ...e, read: true })) })),
    logout: () => setState(initial),
  }), [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function hostFromUrl(url: string) {
  try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; }
}
