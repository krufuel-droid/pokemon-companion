"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { unlockAchievement } from "@/lib/achievements";
import { searchCards, type TcgCard } from "@/lib/tcg";
import speciesIndex from "@/data/pokedex-index.json";
import {
  TCG_FORMATS,
  isBasicEnergy,
  isLegalInFormat,
  maxCopies,
  type TcgFormat,
} from "@/lib/data/tcg-legality";

/**
 * TCG Deck Builder — build 60-card decks, check format legality,
 * cross-reference your collection, export, and share via public link.
 */

interface DeckRow {
  id: string;
  user_id: string;
  name: string;
  format: TcgFormat;
  is_public: boolean;
  created_at: string;
}

interface DeckCardRow {
  id: string;
  deck_id: string;
  card_id: string;
  card_name: string;
  image_url: string | null;
  supertype: string | null;
  subtypes: string | null;
  /** Comma-separated formats where legal, e.g. "Standard,Expanded". Null = unknown. */
  legalities: string | null;
  quantity: number;
}

const SETUP_NOTE =
  "One-time setup needed: run supabase/migration-tcg-decks.sql in the Supabase SQL Editor, then refresh.";

function getSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

function isMissingTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  if (!e) return false;
  return e.code === "42P01" || (e.message ?? "").includes("does not exist");
}

function cardClass(pad = "p-3"): string {
  return `overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 ${pad}`;
}

/* ------------------------------------------------------------------ */
/* Card search (debounced, reuses lib/tcg.ts)                         */
/* ------------------------------------------------------------------ */

function CardSearch({
  onAdd,
  ownedIds,
  format,
}: {
  onAdd: (card: TcgCard) => void;
  ownedIds: Set<string> | null;
  format: TcgFormat;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TcgCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [legalOnly, setLegalOnly] = useState(true);
  const runId = useRef(0);

  // Species autocomplete (local, instant): type 2+ letters, pick a Pokémon.
  const speciesSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return (speciesIndex as { name: string }[])
      .filter((s) => s.name.toLowerCase().startsWith(q))
      .slice(0, 12)
      .map((s) => s.name);
  }, [query]);

  // Format-legality filter for search results.
  const visibleResults = useMemo(() => {
    if (!legalOnly || format === "Unlimited") return results;
    return results.filter((c) => isLegalInFormat(c, format));
  }, [results, legalOnly, format]);
  const hiddenCount = results.length - visibleResults.length;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    const id = ++runId.current;
    const timer = setTimeout(() => {
      searchCards(q)
        .then((cards) => {
          if (runId.current !== id) return;
          setResults(cards);
          setSearched(true);
        })
        .catch((e: unknown) => {
          if (runId.current !== id) return;
          setError(e instanceof Error ? e.message : "Search failed — try again.");
        })
        .finally(() => {
          if (runId.current === id) setLoading(false);
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search cards to add — e.g. Charizard"
        aria-label="Search cards"
        list="deck-builder-species"
        autoComplete="off"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <datalist id="deck-builder-species">
        {speciesSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      {format !== "Unlimited" && (
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <input
            type="checkbox"
            checked={legalOnly}
            onChange={(e) => setLegalOnly(e.target.checked)}
            className="h-4 w-4 rounded accent-emerald-600"
          />
          {format}-legal only
          {searched && legalOnly && hiddenCount > 0 && (
            <span className="font-normal text-slate-400">
              ({hiddenCount} hidden)
            </span>
          )}
        </label>
      )}
      {loading && (
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Searching cards…
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-center text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}
      {!loading && !error && searched && visibleResults.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          {hiddenCount > 0
            ? `No ${format}-legal cards found for “${query.trim()}” — untick the filter to see all prints.`
            : `No cards found for “${query.trim()}”.`}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleResults.map((card) => (
          <div key={card.id} className={cardClass("p-0")}>
            {card.imageSmall ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.imageSmall}
                alt={card.name}
                loading="lazy"
                className="aspect-[245/337] w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex aspect-[245/337] w-full items-center justify-center bg-slate-100 text-3xl dark:bg-slate-800">
                🃏
              </div>
            )}
            <div className="p-2.5">
              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                {card.name}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                #{card.number} · {card.setName}
              </p>
              <div className="mt-1 flex items-center justify-between gap-1">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {card.supertype ?? "—"}
                </span>
                {ownedIds?.has(card.id) && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    ✓ Owned
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onAdd(card)}
                className="mt-2 w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                + Add to deck
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Deck list row with quantity stepper                                 */
/* ------------------------------------------------------------------ */

function DeckCardRowView({
  row,
  owned,
  onQty,
  onRemove,
}: {
  row: DeckCardRow;
  owned: boolean;
  onQty: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      {row.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.image_url}
          alt={row.card_name}
          loading="lazy"
          className="h-16 w-12 shrink-0 rounded-md object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xl dark:bg-slate-800">
          🃏
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
          {row.card_name}
          {owned && (
            <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              ✓
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {row.supertype ?? "—"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onQty(row.quantity - 1)}
          disabled={row.quantity <= 1}
          aria-label={`Remove one ${row.card_name}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-black tabular-nums text-slate-800 dark:text-slate-100">
          {row.quantity}
        </span>
        <button
          type="button"
          onClick={() => onQty(row.quantity + 1)}
          aria-label={`Add one ${row.card_name}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          +
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${row.card_name} from deck`}
          className="ml-1 text-slate-400 hover:text-red-500 dark:text-slate-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main deck builder page                                              */
/* ------------------------------------------------------------------ */

export default function DeckBuilderPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [decks, setDecks] = useState<DeckRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cards, setCards] = useState<DeckCardRow[]>([]);
  const [cardCache, setCardCache] = useState<Map<string, TcgCard>>(new Map());
  const [ownedIds, setOwnedIds] = useState<Set<string> | null>(null);
  const [showOwnedOnly, setShowOwnedOnly] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newFormat, setNewFormat] = useState<TcgFormat>("Standard");
  const [copied, setCopied] = useState(false);

  const activeDeck = decks.find((d) => d.id === activeId) ?? null;
  const totalCards = cards.reduce((s, r) => s + r.quantity, 0);

  const loadDecks = useCallback(async (uid: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error } = await sb
      .from("tcg_decks")
      .select("id, user_id, name, format, is_public, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTable(error)) setSetupNeeded(true);
      return;
    }
    const rows = (data as DeckRow[] | null) ?? [];
    setDecks(rows);
    setActiveId((prev) => prev ?? rows[0]?.id ?? null);
  }, []);

  const loadCards = useCallback(async (deckId: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error } = await sb
      .from("tcg_deck_cards")
      .select("id, deck_id, card_id, card_name, image_url, supertype, subtypes, legalities, quantity")
      .eq("deck_id", deckId)
      .order("card_name", { ascending: true });
    if (error) {
      if (isMissingTable(error)) setSetupNeeded(true);
      return;
    }
    setCards((data as DeckCardRow[] | null) ?? []);
  }, []);

  // Auth + initial load.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }
    sb.auth
      .getUser()
      .then(async ({ data }: { data: { user?: { id?: string } | null } }) => {
        const uid = data.user?.id ?? null;
        setUserId(uid);
        setAuthChecked(true);
        if (uid) {
          await loadDecks(uid);
          // Collection cross-reference ("from my collection" toggle).
          const { data: coll } = await sb
            .from("tcg_collection")
            .select("card_id")
            .eq("user_id", uid)
            .eq("list", "collection");
          if (coll) {
            setOwnedIds(
              new Set((coll as { card_id: string }[]).map((r) => r.card_id))
            );
          } else {
            setOwnedIds(new Set());
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setAuthChecked(true);
        setLoading(false);
      });
  }, [loadDecks]);

  // Load cards whenever the active deck changes.
  useEffect(() => {
    if (activeId) void loadCards(activeId);
    else setCards([]);
  }, [activeId, loadCards]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function createDeck(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    const name = newName.trim();
    if (!sb || !userId || !name || busy) return;
    setBusy(true);
    try {
      const { data, error } = await sb
        .from("tcg_decks")
        .insert({ user_id: userId, name, format: newFormat })
        .select("id, user_id, name, format, is_public, created_at")
        .single();
      if (error) {
        if (isMissingTable(error)) setSetupNeeded(true);
        return;
      }
      const row = data as DeckRow;
      setDecks((ds) => [row, ...ds]);
      setActiveId(row.id);
      setNewName("");
      showToast("Deck created!");
    } finally {
      setBusy(false);
    }
  }

  async function deleteDeck(id: string) {
    const sb = getSupabase();
    if (!sb || busy) return;
    if (!window.confirm("Delete this deck? This can't be undone.")) return;
    setBusy(true);
    try {
      const { error } = await sb.from("tcg_decks").delete().eq("id", id);
      if (error) return;
      setDecks((ds) => {
        const next = ds.filter((d) => d.id !== id);
        if (activeId === id) setActiveId(next[0]?.id ?? null);
        return next;
      });
      showToast("Deck deleted.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublic(deck: DeckRow) {
    const sb = getSupabase();
    if (!sb || busy) return;
    setBusy(true);
    try {
      const { error } = await sb
        .from("tcg_decks")
        .update({ is_public: !deck.is_public })
        .eq("id", deck.id);
      if (error) return;
      setDecks((ds) =>
        ds.map((d) => (d.id === deck.id ? { ...d, is_public: !d.is_public } : d))
      );
      showToast(deck.is_public ? "Deck is now private." : "Deck is now public!");
    } finally {
      setBusy(false);
    }
  }

  function copyShareLink() {
    if (!activeDeck) return;
    const url = `${window.location.origin}/tools/deck-builder/${activeDeck.id}`;
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(done);
    } else {
      done();
    }
  }

  /** Add a card (or bump quantity), respecting the 4-copy rule. */
  async function addCard(card: TcgCard) {
    const sb = getSupabase();
    if (!sb || !activeDeck || busy) return;
    const existing = cards.find((r) => r.card_id === card.id);
    const limit = maxCopies(card);
    if (existing && existing.quantity >= limit) {
      showToast(
        isBasicEnergy(card)
          ? "That's plenty of energy!"
          : "Max 4 copies of a card per deck."
      );
      return;
    }
    setBusy(true);
    try {
      if (existing) {
        const { error } = await sb
          .from("tcg_deck_cards")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
        if (error) return;
        const next = cards.map((r) =>
          r.id === existing.id ? { ...r, quantity: r.quantity + 1 } : r
        );
        setCards(next);
        maybeFireDeckAchievement(next);
      } else {
        const { data, error } = await sb
          .from("tcg_deck_cards")
          .insert({
            deck_id: activeDeck.id,
            card_id: card.id,
            card_name: card.name,
            image_url: card.imageSmall || null,
            supertype: card.supertype,
            subtypes: card.subtypes.join(",") || null,
            legalities: TCG_FORMATS.filter((f) => isLegalInFormat(card, f)).join(","),
          })
          .select("id, deck_id, card_id, card_name, image_url, supertype, subtypes, legalities, quantity")
          .single();
        if (error) {
          if (isMissingTable(error)) setSetupNeeded(true);
          return;
        }
        const next = [...cards, data as DeckCardRow].sort((a, b) =>
          a.card_name.localeCompare(b.card_name)
        );
        setCards(next);
        setCardCache((m) => new Map(m).set(card.id, card));
        maybeFireDeckAchievement(next);
      }
    } finally {
      setBusy(false);
    }
  }

  function maybeFireDeckAchievement(next: DeckCardRow[]) {
    if (!userId) return;
    const total = next.reduce((s, r) => s + r.quantity, 0);
    if (total === 60) {
      void unlockAchievement(userId, "deck-builder").catch(() => {});
      showToast("🃏 Achievement unlocked: Deck Architect!");
    }
  }

  async function setQty(row: DeckCardRow, qty: number) {
    const sb = getSupabase();
    if (!sb || busy) return;
    // Enforce the 4-copy rule on the way up (basic energy exempt).
    if (qty > row.quantity) {
      const full = cardCache.get(row.card_id);
      const limit = full
        ? maxCopies(full)
        : row.supertype === "Energy" &&
            (row.subtypes ?? "").split(",").includes("Basic")
          ? 99
          : 4;
      if (qty > limit) {
        showToast("Max 4 copies of a card per deck.");
        return;
      }
    }
    setBusy(true);
    try {
      if (qty <= 0) {
        const { error } = await sb.from("tcg_deck_cards").delete().eq("id", row.id);
        if (error) return;
        setCards((cs) => cs.filter((r) => r.id !== row.id));
      } else {
        const { error } = await sb
          .from("tcg_deck_cards")
          .update({ quantity: qty })
          .eq("id", row.id);
        if (error) return;
        const next = cards.map((r) => (r.id === row.id ? { ...r, quantity: qty } : r));
        setCards(next);
        maybeFireDeckAchievement(next);
      }
    } finally {
      setBusy(false);
    }
  }

  function exportText() {
    if (!activeDeck) return;
    const groups = groupBySupertype(cards);
    const lines: string[] = [
      `${activeDeck.name} (${activeDeck.format}) — ${totalCards}/60 cards`,
      "",
    ];
    for (const [label, rows] of groups) {
      const n = rows.reduce((s, r) => s + r.quantity, 0);
      lines.push(`${label} (${n}):`);
      for (const r of rows) lines.push(`  ${r.quantity}x ${r.card_name}`);
      lines.push("");
    }
    const text = lines.join("\n");
    const done = () => showToast("Deck list copied to clipboard!");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      done();
    }
  }

  // ---- derived stats -------------------------------------------------
  const groups = useMemo(() => groupBySupertype(cards), [cards]);
  const illegalCards = useMemo(() => {
    if (!activeDeck) return [];
    return cards.filter((r) => {
      // Prefer the stored legality snapshot (survives reloads).
      if (r.legalities != null) {
        return !r.legalities.split(",").includes(activeDeck.format);
      }
      const full = cardCache.get(r.card_id);
      if (!full) return false;
      return !isLegalInFormat(full, activeDeck.format);
    });
  }, [cards, cardCache, activeDeck]);

  const visibleCards = showOwnedOnly && ownedIds ? cards.filter((r) => ownedIds.has(r.card_id)) : cards;

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <p className="text-center text-slate-500 dark:text-slate-400">Loading deck builder…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        🃏 TCG Deck Builder
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Build 60-card decks, check format legality, and share them with a link.
      </p>

      {setupNeeded && (
        <p className="mt-6 rounded-2xl bg-amber-50 p-6 text-center text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900">
          {SETUP_NOTE}
        </p>
      )}

      {authChecked && !userId && (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sign in to build and save decks, cross-reference your collection, and share them.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Sign in
          </Link>
        </div>
      )}

      {userId && !setupNeeded && (
        <>
          {/* Deck picker + new deck */}
          <section aria-label="Your decks" className="mt-6">
            <div className="flex flex-wrap gap-2">
              {decks.map((d) => {
                const count = d.id === activeId ? totalCards : null;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActiveId(d.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      d.id === activeId
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {d.name}
                    {count !== null && (
                      <span className="ml-1.5 tabular-nums opacity-80">{count}/60</span>
                    )}
                  </button>
                );
              })}
            </div>
            <form onSubmit={createDeck} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New deck name — e.g. Charizard ex"
                aria-label="New deck name"
                maxLength={60}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <select
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value as TcgFormat)}
                aria-label="Format"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {TCG_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy || !newName.trim()}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                + New deck
              </button>
            </form>
          </section>

          {activeDeck && (
            <>
              {/* Deck header: progress, format, actions */}
              <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      {activeDeck.name}
                      <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {activeDeck.format}
                      </span>
                    </h2>
                    <div className="mt-2 h-2.5 w-56 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all ${
                          totalCards === 60 ? "bg-emerald-500" : "bg-sky-500"
                        }`}
                        style={{ width: `${Math.min(100, (totalCards / 60) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                      {totalCards}/60 cards
                      {totalCards === 60 && (
                        <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                          ✓ Deck complete!
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={exportText}
                      className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-400 dark:border-slate-600 dark:text-slate-200"
                    >
                      📋 Export to text
                    </button>
                    <button
                      type="button"
                      onClick={() => void togglePublic(activeDeck)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                        activeDeck.is_public
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {activeDeck.is_public ? "🌐 Public" : "🔒 Private"}
                    </button>
                    {activeDeck.is_public && (
                      <button
                        type="button"
                        onClick={copyShareLink}
                        className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        {copied ? "✓ Copied!" : "🔗 Copy share link"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteDeck(activeDeck.id)}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Type breakdown */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {groups.map(([label, rows]) => {
                    const n = rows.reduce((s, r) => s + r.quantity, 0);
                    return (
                      <div
                        key={label}
                        className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800"
                      >
                        <div className="text-2xl font-black tabular-nums text-slate-800 dark:text-slate-100">
                          {n}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legality warnings */}
                {illegalCards.length > 0 && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900">
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                      ⚠️ Not legal in {activeDeck.format}:
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-amber-700 dark:text-amber-400">
                      {illegalCards.map((r) => (
                        <li key={r.id}>{r.card_name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Collection cross-reference toggle */}
                {ownedIds && (
                  <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showOwnedOnly}
                      onChange={(e) => setShowOwnedOnly(e.target.checked)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    📦 From my collection — highlight cards I own
                    {showOwnedOnly && " (showing owned only)"}
                  </label>
                )}
              </section>

              {/* Deck list */}
              <section aria-label="Deck list" className="mt-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Deck list
                </h3>
                {visibleCards.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {showOwnedOnly
                      ? "None of these cards are in your collection yet."
                      : "Search for cards below to start building."}
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {visibleCards.map((row) => (
                      <DeckCardRowView
                        key={row.id}
                        row={row}
                        owned={ownedIds?.has(row.card_id) ?? false}
                        onQty={(q) => void setQty(row, q)}
                        onRemove={() => void setQty(row, 0)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Add cards */}
              <section aria-label="Add cards" className="mt-8">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Add cards
                </h3>
                <div className="mt-3">
                  <CardSearch
                    onAdd={(c) => void addCard(c)}
                    ownedIds={ownedIds}
                    format={activeDeck.format}
                  />
                </div>
              </section>
            </>
          )}

          {decks.length === 0 && (
            <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
              No decks yet — name one above and start building!
            </p>
          )}
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
          {toast}
        </div>
      )}
    </main>
  );
}

/** Group deck rows by supertype for the breakdown + export. */
function groupBySupertype(rows: DeckCardRow[]): [string, DeckCardRow[]][] {
  const order = ["Pokémon", "Trainer", "Energy"];
  const map = new Map<string, DeckCardRow[]>();
  for (const r of rows) {
    const key = r.supertype ?? "Other";
    const arr = map.get(key) ?? [];
    arr.push(r);
    map.set(key, arr);
  }
  const out: [string, DeckCardRow[]][] = [];
  for (const k of order) {
    if (map.has(k)) out.push([k, map.get(k)!]);
  }
  for (const [k, v] of map) {
    if (!order.includes(k)) out.push([k, v]);
  }
  return out;
}
