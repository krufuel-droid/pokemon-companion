import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import Avatar from "@/components/Avatar";
import { timeAgo } from "@/lib/community";
import { getSpeciesById } from "@/lib/pokedex";
import type { Profile } from "@/components/AuthProvider";

/** "Online" = seen within the last 5 minutes (same window as the friends list). */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const t = new Date(lastSeen).getTime();
  return !Number.isNaN(t) && Date.now() - t < ONLINE_WINDOW_MS;
}

/** Escape LIKE wildcards so `ilike` behaves like a case-insensitive exact match. */
function ilikeEscape(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

type FriendProfileRow = Profile & { last_seen: string | null };

interface AchievementUnlock {
  achievement_id: string;
  unlocked_at: string;
}

interface Catch {
  species_name: string;
  nickname: string | null;
  added_at: string;
  run_id: string;
}

export default async function TrainerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  if (!isSupabaseConfigured()) return <SupabaseNeeded />;

  const { username } = await params;
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      "id, username, avatar_url, bio, favorite_pokemon, buddy_species_id, buddy_nickname, last_seen, created_at",
    )
    .ilike("username", ilikeEscape(decodeURIComponent(username)))
    .maybeSingle();

  if (!profileData) notFound();
  const profile = profileData as FriendProfileRow;

  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  const isOwn = me?.id === profile.id;

  // Stats snapshot — same three counts the Compare tab uses.
  const [achRes, runsRes, catchesRes, unlocksRes, catchFeedRes, defsRes] =
    await Promise.all([
      supabase
        .from("user_achievements")
        .select("achievement_id", { count: "exact", head: true })
        .eq("user_id", profile.id),
      supabase
        .from("nuzlockes")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", profile.id),
      supabase
        .from("nuzlocke_team")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id),
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", profile.id)
        .order("unlocked_at", { ascending: false })
        .limit(10),
      supabase
        .from("nuzlocke_team")
        .select("species_name, nickname, added_at, run_id")
        .eq("user_id", profile.id)
        .order("added_at", { ascending: false })
        .limit(10),
      supabase.from("achievements").select("id, name, icon"),
    ]);

  const stats = {
    achievements: achRes.count ?? 0,
    runs: runsRes.count ?? 0,
    catches: catchesRes.count ?? 0,
  };

  // Recent activity: last ~10 events (achievement unlocks + catches), merged.
  const defMap = new Map<string, { name: string; icon: string }>(
    (((defsRes.data as { id: string; name: string; icon: string }[] | null) ?? []).map((d) => [
      d.id,
      { name: d.name, icon: d.icon },
    ])),
  );
  const unlocks = (unlocksRes.data as AchievementUnlock[] | null) ?? [];
  const catches = (catchFeedRes.data as Catch[] | null) ?? [];

  let runTitles = new Map<string, string>();
  const runIds = [...new Set(catches.map((c) => c.run_id))];
  if (runIds.length > 0) {
    const { data } = await supabase.from("nuzlockes").select("id, title").in("id", runIds);
    runTitles = new Map(
      ((data as { id: string; title: string }[] | null) ?? []).map((r) => [r.id, r.title]),
    );
  }

  const activity: (
    | { kind: "achievement"; key: string; at: string; icon: string; name: string }
    | { kind: "catch"; key: string; at: string; species: string; nickname: string | null; runTitle: string | null }
  )[] = [
    ...unlocks.map((u) => ({
      kind: "achievement" as const,
      key: `ua-${profile.id}-${u.achievement_id}`,
      at: u.unlocked_at,
      icon: defMap.get(u.achievement_id)?.icon ?? "🏆",
      name: defMap.get(u.achievement_id)?.name ?? "an achievement",
    })),
    ...catches.map((c, i) => ({
      kind: "catch" as const,
      key: `catch-${profile.id}-${c.added_at}-${i}`,
      at: c.added_at,
      species: c.species_name,
      nickname: c.nickname,
      runTitle: runTitles.get(c.run_id) ?? null,
    })),
  ];
  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const recent = activity.slice(0, 10);

  const buddy =
    profile.buddy_species_id != null ? getSpeciesById(profile.buddy_species_id) : undefined;
  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  const cardClass =
    "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className={cardClass}>
        <div className="flex items-start gap-5">
          <Avatar
            username={profile.username}
            avatarUrl={profile.avatar_url}
            size={80}
            online={isOnline(profile.last_seen)}
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-slate-100">
              {profile.username}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isOnline(profile.last_seen) ? (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Online</span>
              ) : (
                <>Trainer since {memberSince}</>
              )}
            </p>
          </div>
          {isOwn && (
            <Link
              href="/profile"
              className="shrink-0 rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-mint hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:text-slate-100"
            >
              Edit profile
            </Link>
          )}
        </div>
        {profile.bio && (
          <p className="mt-6 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Active Buddy */}
      <div className={`${cardClass} mt-6`}>
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">Active Buddy</h2>
        {buddy ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={buddy.sprites.regular}
              alt={buddy.name}
              width={112}
              height={112}
              className="h-28 w-28 object-contain"
            />
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {profile.buddy_nickname ?? buddy.name}
              </p>
              {profile.buddy_nickname && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{buddy.name}</p>
              )}
              <Link
                href={`/pokedex/${buddy.id}`}
                className="mt-1 inline-block text-sm font-semibold text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
              >
                View in Pokédex →
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isOwn ? (
              <>
                No buddy set —{" "}
                <Link href="/profile" className="font-semibold underline">
                  pick one on your profile
                </Link>
                .
              </>
            ) : (
              "No buddy set."
            )}
          </p>
        )}
      </div>

      {/* Stats snapshot */}
      <div className={`${cardClass} mt-6`}>
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Stats</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { value: stats.achievements, label: "Achievements" },
            { value: stats.runs, label: "Nuzlocke runs" },
            { value: stats.catches, label: "Nuzlocke catches" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-stone-50 px-2 py-4 dark:bg-slate-950"
            >
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className={`${cardClass} mt-6`}>
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Recent activity
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nothing to show yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {recent.map((item) => (
              <li
                key={item.key}
                className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 dark:bg-slate-950"
              >
                <span role="img" aria-hidden="true" className="text-xl">
                  {item.kind === "achievement" ? item.icon : "⚾"}
                </span>
                <div className="min-w-0 flex-1">
                  {item.kind === "achievement" ? (
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Unlocked <span className="font-semibold">{item.name}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Caught{" "}
                      <span className="font-semibold">
                        {item.nickname ? `${item.nickname} (${item.species})` : item.species}
                      </span>
                      {item.runTitle && (
                        <span className="text-slate-500 dark:text-slate-400"> in {item.runTitle}</span>
                      )}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    {timeAgo(item.at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
