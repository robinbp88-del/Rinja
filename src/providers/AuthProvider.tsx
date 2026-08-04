import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { touchUserActivity } from "../lib/activity";
import { supabase } from "../lib/supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Restore from persisted session first (stays signed in after app close).
    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (cancelled) return;
        if (sessionError) {
          setError(sessionError.message);
          setUser(null);
        } else {
          setError(null);
          setUser(data.session?.user ?? null);
          if (data.session?.user) {
            void touchUserActivity();
          }
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Auth failed");
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setError(null);
      setLoading(false);
      if (session?.user) {
        void touchUserActivity();
      }
    });

    const activityTimer = window.setInterval(() => {
      void touchUserActivity();
    }, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearInterval(activityTimer);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
