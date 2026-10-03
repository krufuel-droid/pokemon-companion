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
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Shape of a row in public.profiles. */
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  favorite_pokemon: string | null;
  /** Section 1: buddy Pokémon shown on the friend profile flex sheet. */
  buddy_species_id: number | null;
  buddy_nickname: string | null;
  /** Section 5: shareable 12-digit trainer code (null until the SQL is run). */
  trainer_code: string | null;
  /** When true, only friends can see the full profile. */
  is_private: boolean;
  /** Binder Showcase: when true, /binder/[username] is publicly visible. */
  show_binder: boolean;
  created_at: string;
}

/**
 * Generate a random 12-digit trainer code (Section 5: friend invites).
 * The database backfill in supabase/schema.sql covers existing rows; this
 * covers brand-new profiles created before/without that column populated.
 */
export function generateTrainerCode(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 12; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => String(b % 10)).join("");
}

interface AuthContextValue {
  /** False when Supabase env vars are missing — auth UI degrades gracefully. */
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Recent auth events for diagnostics (only populated when ?debug=auth). */
  authEvents: string[];
}

const AuthContext = createContext<AuthContextValue>({
  configured: false,
  loading: false,
  user: null,
  profile: null,
  refreshProfile: async () => {},
  signOut: async () => {},
  authEvents: [],
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = useMemo(() => isSupabaseConfigured(), []);
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEvents, setAuthEvents] = useState<string[]>([]);
  // Only record diagnostics when explicitly requested via ?debug=auth.
  const debugAuth = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debug") === "auth",
    []
  );
  const logEvent = useCallback(
    (msg: string) => {
      if (!debugAuth) return;
      const t = new Date().toISOString().slice(11, 23);
      setAuthEvents((prev) => [...prev.slice(-19), `${t} ${msg}`]);
    },
    [debugAuth]
  );

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const full = "id, username, avatar_url, bio, favorite_pokemon, buddy_species_id, buddy_nickname, trainer_code, is_private, show_binder, created_at";
      const minimal = "id, username, avatar_url, bio, favorite_pokemon, created_at";
      let { data } = await supabase
        .from("profiles")
        .select(full)
        .eq("id", userId)
        .maybeSingle();
      if (!data) {
        // Fall back if newer columns haven't been migrated yet.
        const retry = await supabase
          .from("profiles")
          .select(minimal)
          .eq("id", userId)
          .maybeSingle();
        data = retry.data as typeof data;
      }
      if (data && "trainer_code" in data && !data.trainer_code) {
        // Column exists but this row predates the backfill: stamp a code now.
        // Best-effort and fire-and-forget — the unique index makes a collision
        // fail the update, in which case the row simply stays code-less.
        const code = generateTrainerCode();
        const profileId = data.id as string;
        void supabase
          .from("profiles")
          .update({ trainer_code: code })
          .eq("id", profileId)
          .then(({ error }: { error: { message: string } | null }) => {
            if (!error) {
              setProfile((p) =>
                p && p.id === profileId ? { ...p, trainer_code: code } : p,
              );
            }
          });
      }
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

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (cancelled) return;
      const sessionUser = data.session?.user ?? null;
      logEvent(
        `getSession -> ${sessionUser ? `user ${sessionUser.id.slice(0, 8)}` : "null"}`
      );
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
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (cancelled) return;
      const sessionUser = session?.user ?? null;
      logEvent(
        `onAuthStateChange ${event} -> ${sessionUser ? `user ${sessionUser.id.slice(0, 8)}` : "null"}`
      );
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
  }, [configured, fetchProfile, logEvent]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // Lightweight presence heartbeat: stamp profiles.last_seen so friends can
  // see who's online ("online" = seen within 5 minutes). Fire-and-forget and
  // best-effort — a failure here must never break auth.
  useEffect(() => {
    if (!configured || !user) return;
    const supabase = createClient();
    let cancelled = false;
    const beat = async () => {
      try {
        await supabase
          .from("profiles")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", user.id);
      } catch {
        // best-effort; ignore
      }
    };
    void beat();
    const timer = setInterval(() => {
      if (!cancelled) void beat();
    }, 4 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [configured, user]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({ configured, loading, user, profile, refreshProfile, signOut, authEvents }),
    [configured, loading, user, profile, refreshProfile, signOut, authEvents],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
