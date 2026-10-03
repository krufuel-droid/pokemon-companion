"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

/** Star toggle to favorite/unfavorite a Pokémon species. Stops click propagation. */
export default function FavoriteButton({ speciesId }: { speciesId: number }) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorited(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("species_id", speciesId)
          .maybeSingle();
        if (!cancelled) setFavorited(!!data);
      } catch {
        // table may not exist yet; stay unfavorited
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, speciesId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      if (favorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("species_id", speciesId);
        setFavorited(false);
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          species_id: speciesId,
        });
        if (error && error.code !== "23505") throw error;
        setFavorited(true);
      }
    } catch {
      // best-effort
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={(e) => void toggle(e)}
      disabled={busy}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
      className={`absolute right-2 top-2 rounded-full p-1.5 transition ${
        favorited
          ? "text-yellow-500 hover:text-yellow-600"
          : "text-slate-300 hover:text-yellow-400 dark:text-slate-600 dark:hover:text-yellow-400"
      } disabled:opacity-50`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}
