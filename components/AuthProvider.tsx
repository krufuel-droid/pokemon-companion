"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Shape of a row in public.profiles. */
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  favorite_pokemon: string | null;
  created_at: string;
}

interface AuthContextValue {
  /** False when Supabase env vars are missing — auth UI degrades gracefully. */
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  configured: false,
  loading: false,
  user: null,
  profile: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = useMemo(() => isSupabaseConfigured(), []);
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, favorite_pokemon, created_at")
        .eq("id", userId)
        .maybeSingle();
      setProfile((data as Profile | null) ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // When Supabase isn't configured, loading already starts as false and
    // there is nothing to subscribe to.
    if (!configured) return;
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        fetchProfile(sessionUser.id).finally(() => {
          if (!cancelled) setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        void fetchProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({ configured, loading, user, profile, refreshProfile, signOut }),
    [configured, loading, user, profile, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
