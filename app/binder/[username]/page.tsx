import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import Avatar from "@/components/Avatar";
import { englishDetail, formatPrice, type CardPricing } from "@/lib/tcgdex";

/**
 * Public, read-only binder showcase (/binder/[username]).
 * Works for logged-out visitors: reads go through the anon-key server
 * client, and RLS only exposes binder/collection/master-set rows when the
 * owner has opted in via profiles.show_binder.
 */

/** Session-level price cache (same style as the Value tab). */
const binderPriceCache = new Map<string, CardPricing | null>();

/** Fetch USD pricing for many card ids with a concurrency cap. */
async function fetchBinderPrices(cardIds: string[]): Promise<void> {
  const queue = [...cardIds].filter((id) => !binderPriceCache.has(id));
  const workers: Promise<void>[] = [];
  const next = async () => {
    while (queue.length > 0) {
      const id = queue.shift()!;
      try {
        const detail = await englishDetail(id);
        binderPriceCache.set(id, detail ? detail.pricing : null);
      } catch {
        binderPriceCache.set(id, null);
      }
    }
  };
  for (let i = 0; i < Math.min(6, queue.length); i++) workers.push(next());
  await Promise.all(workers);
}

/** Escape LIKE wildcards so `ilike` behaves like a case-insensitive exact match. */
function ilikeEscape(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

interface Pin {
  card_id: string;
  card_name: string;
  image_url: string | null;
  set_name: string | null;
  position: number;
}

interface EmptyStateProps {
  emoji: string;
  title: string;
  body: string;
}

function EmptyState({ emoji, title, body }: EmptyStateProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
      <p className="text-5xl">{emoji}</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {body}
      </p>
      <Link
        href="/tools/tcg-collection"
        className="mt-6 inline-block rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        🃏 Open the TCG Collection Tracker
      </Link>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return {
    title: `${decodeURIComponent(username)}'s Binder | Poké Companion`,
    description: "A public showcase of a trainer's favorite Pokémon TCG cards.",
  };
}

export default async function BinderPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  if (!isSupabaseConfigured()) return <SupabaseNeeded />;

  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, show_binder")
    .ilike("username", ilikeEscape(username))
    .maybeSingle();

  if (!profile) {
    return (
      <EmptyState
        emoji="🔍"
        title="No trainer found"
        body={`There's no trainer named "${username}" on Poké Companion. Check the spelling of the binder link and try again.`}
      />
    );
  }

  if (!profile.show_binder) {
    return (
      <EmptyState
        emoji="🔒"
        title="This binder is private"
        body={`${profile.username} hasn't published their binder yet. Binder pages are opt-in — the trainer can make theirs public from their profile page.`}
      />
    );
  }

  const [pinsRes, collectionRes, masterRes] = await Promise.all([
    supabase
      .from("binder_showcase")
      .select("card_id, card_name, image_url, set_name, position")
      .eq("user_id", profile.id)
      .order("position", { ascending: true }),
    supabase
      .from("tcg_collection")
      .select("card_id, quantity")
      .eq("user_id", profile.id)
      .eq("list", "collection"),
    supabase
      .from("tcg_master_set")
      .select("card_id, language")
      .eq("user_id", profile.id),
  ]);

  const pins = ((pinsRes.data as Pin[] | null) ?? []).slice(0, 9);
  const collectionRows = (collectionRes.data as
    | { card_id: string; quantity: number }[]
    | null) ?? [];
  const masterRows = (masterRes.data as
    | { card_id: string; language: string }[]
    | null) ?? [];

  // Portfolio value (USD) across collection + master-set marks.
  const priceIds = new Set<string>();
  for (const r of collectionRows) priceIds.add(r.card_id);
  for (const r of masterRows) priceIds.add(r.card_id);
  await fetchBinderPrices([...priceIds]);

  const totalCards = collectionRows.reduce((s, r) => s + (r.quantity || 0), 0);
  const valueUsd =
    collectionRows.reduce(
      (s, r) => s + (binderPriceCache.get(r.card_id)?.usd ?? 0) * (r.quantity || 0),
      0
    ) +
    masterRows.reduce(
      (s, r) => s + (binderPriceCache.get(r.card_id)?.usd ?? 0),
      0
    );

  const languages = new Set(masterRows.map((r) => r.language)).size;
  const slots: (Pin | null)[] = Array.from({ length: 9 }, (_, i) =>
    pins.find((p) => p.position === i) ?? null
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={72} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            📸 Binder showcase
          </p>
          <h1 className="truncate text-3xl font-bold text-slate-800 dark:text-slate-100">
            {profile.username}&apos;s Binder
          </h1>
          {profile.bio && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Total cards", value: String(totalCards) },
          { label: "Portfolio value", value: formatPrice(valueUsd, "USD") },
          {
            label: "Master-set prints",
            value: masterRows.length > 0 ? `${masterRows.length} · ${languages} lang` : "—",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
          >
            <div className="truncate text-xl font-black tabular-nums text-slate-800 dark:text-slate-100 sm:text-2xl">
              {s.value}
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Values are USD market prices via TCGdex (TCGPlayer), updated daily.
      </p>

      {/* Showcase pins */}
      <h2 className="mt-10 text-lg font-bold text-slate-800 dark:text-slate-100">
        ⭐ Showcase cards{" "}
        <span className="text-xs font-semibold text-slate-400">
          {pins.length} of 9
        </span>
      </h2>
      {pins.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-slate-100 p-8 text-center text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          {profile.username} hasn&apos;t pinned any showcase cards yet.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {slots.map((pin, i) =>
            pin ? (
              <figure
                key={pin.card_id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                {pin.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pin.image_url}
                    alt={pin.card_name}
                    loading="lazy"
                    className="aspect-[245/337] w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex aspect-[245/337] w-full items-center justify-center bg-slate-100 text-3xl dark:bg-slate-800">
                    🃏
                  </div>
                )}
                <figcaption className="p-3">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                    {pin.card_name}
                  </p>
                  {pin.set_name && (
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {pin.set_name}
                    </p>
                  )}
                </figcaption>
              </figure>
            ) : (
              <div
                key={`empty-${i}`}
                aria-hidden="true"
                className="flex aspect-[245/337] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600"
              >
                <span className="text-3xl">📌</span>
                <span className="text-xs font-semibold">Empty slot</span>
              </div>
            )
          )}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-400 dark:text-slate-500">
        Made with the{" "}
        <Link
          href="/tools/tcg-collection"
          className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
        >
          TCG Collection Tracker
        </Link>{" "}
        on Poké Companion
      </p>
    </main>
  );
}
