import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import Avatar from "@/components/Avatar";

interface DeckCardRow {
  card_id: string;
  card_name: string;
  image_url: string | null;
  supertype: string | null;
  quantity: number;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) return { title: "Deck | Poké Companion" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("tcg_decks")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  const name = (data as { name?: string } | null)?.name ?? "Deck";
  return {
    title: `${name} | Poké Companion`,
    description: "A shared Pokémon TCG deck list.",
  };
}

/**
 * Public, read-only deck view (/tools/deck-builder/[id]).
 * Works logged out: RLS only exposes decks with is_public = true.
 */
export default async function PublicDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) return <SupabaseNeeded />;

  const { id } = await params;
  const supabase = await createClient();

  const { data: deckData } = await supabase
    .from("tcg_decks")
    .select("id, user_id, name, format, is_public, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!deckData) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
          Deck not found
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          This deck doesn&apos;t exist, isn&apos;t public, or the deck tables
          haven&apos;t been set up yet.
        </p>
        <Link
          href="/tools/deck-builder"
          className="mt-6 inline-block rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          🃏 Build your own deck
        </Link>
      </main>
    );
  }

  const deck = deckData as {
    id: string;
    user_id: string;
    name: string;
    format: string;
    is_public: boolean;
    created_at: string;
  };

  const [{ data: cardsData }, { data: profileData }] = await Promise.all([
    supabase
      .from("tcg_deck_cards")
      .select("card_id, card_name, image_url, supertype, quantity")
      .eq("deck_id", deck.id)
      .order("card_name", { ascending: true }),
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", deck.user_id)
      .maybeSingle(),
  ]);

  const cards = ((cardsData as DeckCardRow[] | null) ?? []).sort((a, b) => {
    const order = (s: string | null) =>
      s === "Pokémon" ? 0 : s === "Trainer" ? 1 : s === "Energy" ? 2 : 3;
    return order(a.supertype) - order(b.supertype) || a.card_name.localeCompare(b.card_name);
  });
  const total = cards.reduce((s, r) => s + r.quantity, 0);
  const profile = profileData as { username: string; avatar_url: string | null } | null;

  const groups = new Map<string, DeckCardRow[]>();
  for (const c of cards) {
    const k = c.supertype ?? "Other";
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        🃏 Shared deck · {deck.format}
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
        {deck.name}
      </h1>
      {profile && (
        <div className="mt-3 flex items-center gap-2">
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={28} />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            by <span className="font-semibold text-slate-700 dark:text-slate-200">{profile.username}</span>
          </span>
        </div>
      )}
      <p className="mt-2 text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-300">
        {total}/60 cards
      </p>

      <div className="mt-6 space-y-6">
        {[...groups.entries()].map(([label, rows]) => {
          const n = rows.reduce((s, r) => s + r.quantity, 0);
          return (
            <section key={label} aria-label={label}>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {label} <span className="text-sm font-semibold text-slate-400">({n})</span>
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {rows.map((r) => (
                  <div
                    key={r.card_id}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                  >
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.image_url}
                        alt={r.card_name}
                        loading="lazy"
                        className="aspect-[245/337] w-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex aspect-[245/337] w-full items-center justify-center bg-slate-100 text-3xl dark:bg-slate-800">
                        🃏
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 p-2.5">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {r.card_name}
                      </p>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        ×{r.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/tools/deck-builder"
          className="inline-block rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          🃏 Build your own deck
        </Link>
      </div>
    </main>
  );
}
