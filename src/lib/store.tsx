import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type User = {
  name: string;
  email: string;
  avatar?: string;
  interests: string[];
};

type State = {
  onboarded: boolean;
  user: User | null;
};

type Ctx = State & {
  completeOnboarding: (user: User) => void;
  setInterests: (interests: string[]) => void;
  logout: () => void;
};

const KEY = "watchpage.state.v1";

const initial: State = {
  onboarded: false,
  user: null,
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        setState({
          onboarded: parsed.onboarded ?? false,
          user: parsed.user ?? null,
        });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      completeOnboarding: (user) =>
        setState((s) => ({ ...s, onboarded: true, user })),
      setInterests: (interests) =>
        setState((s) => ({
          ...s,
          user: s.user ? { ...s.user, interests } : s.user,
        })),
      logout: () => setState(initial),
    }),
    [state],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function hostFromUrl(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
