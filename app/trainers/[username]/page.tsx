import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { searchSpecies } from "@/lib/pokedex";
import type { Profile } from "@/components/AuthProvider";

function favoriteSprite(name: string | null): { sprite: string; label: string; id: number } | null {
  if (!name) return null;
  const q = name.trim().toLowerCase();
  if (q.length < 2) return null;
  const exact = searchSpecies(q).find((s) => s.name.toLowerCase() === q);
  return exact ? { sprite: exact.sprites.regular, label: exact.name, id: exact.id } : null;
}

export default async function TrainerPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  if (!isSupabaseConfigured()) return <SupabaseNeeded />;

  const { username } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, favorite_pokemon, created_at")
    .eq("username", decodeURIComponent(username))
    .maybeSingle();

  if (!data) notFound();
  const profile = data as Profile;

  const initial = profile.username.charAt(0).toUpperCase();
  const favorite = favoriteSprite(profile.favorite_pokemon);
  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-5">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={`${profile.username}'s avatar`}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-mint"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-mint text-3xl font-bold text-slate-900 dark:text-slate-100">
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-slate-100">
              {profile.username}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Trainer since {memberSince}</p>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-6 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{profile.bio}</p>
        )}

        {favorite && (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 dark:bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={favorite.sprite} alt={favorite.label} width={56} height={56} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Favorite Pokémon
              </p>
              <Link
                href={`/pokedex/${favorite.id}`}
                className="text-sm font-bold text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
              >
                {favorite.label}
              </Link>
            </div>
          </div>
        )}

        {!profile.bio && !favorite && (
          <p className="mt-6 text-sm italic text-slate-400 dark:text-slate-500">
            This trainer hasn&apos;t filled out their profile yet.
          </p>
        )}
      </div>
    </div>
  );
}
