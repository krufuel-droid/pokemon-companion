"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  detailsForPrints,
  englishDetail,
  formatPrice,
  listSets,
  searchPrints,
  setCards,
  variantBadges,
  type TcgdexCardDetail,
  type TcgdexCardSummary,
  type TcgdexSetSummary,
} from "@/lib/tcgdex";

/**
 * Card Database — the reference/browser side of the TCG tools.
 * Search every print by name, or browse a whole set, and tap any card
 * for rarity, variants, and market prices. Personal tracking (what you
 * own / want) lives in the TCG Collection Tracker instead.
 */

type Mode = "search" | "set";

/** Search-mode results get full details (set/rarity/price) up to this many prints. */
const SEARCH_DETAIL_CAP = 60;

export default function CardDatabasePage() {
  const [mode, setMode] = useState<Mode>("search");

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TcgdexCardSummary[]>([]);
  const [detailCount, setDetailCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchedFor, setSearchedFor] = useState<string | null>(null);

  // Set state
  const [sets, setSets] = useState<TcgdexSetSummary[]>([]);
  const [setsError, setSetsError] = useState<string | null>(null);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [setResults, setSetResults] = useState<TcgdexCardSummary[]>([]);
  const [loadingSet, setLoadingSet] = useState(false);

  // Shared card details + viewer
  const [details, setDetails] = useState<Map<string, TcgdexCardDetail>>(new Map());
  const [viewing, setViewing] = useState<TcgdexCardSummary | null>(null);
  const [viewDetail, setViewDetail] = useState<TcgdexCardDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    listSets()
      .then((s) => {
        if (!cancelled) setSets(s);
      })
      .catch(() => {
        if (!cancelled) setSetsError("Couldn't load the set list — set browsing is unavailable right now.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) return;
    const my = ++seq.current;
    setSearching(true);
    setError(null);
    setSearchedFor(q);
    try {
      const prints = await searchPrints(q);
      if (my !== seq.current) return;
      setSearchResults(prints);
      setDetails(new Map());
      setDetailCount(0);
      if (prints.length > 0) {
        const slice = prints.slice(0, SEARCH_DETAIL_CAP);
        const map = await detailsForPrints(
          slice.map((c) => c.id),
          "en"
        );
        if (my !== seq.current) return;
        setDetails(map);
        setDetailCount(slice.length);
      }
    } catch (e) {
      if (my === seq.current) {
        setError(e instanceof Error ? e.message : "Search failed — try again in a moment.");
        setSearchResults([]);
      }
    } finally {
      if (my === seq.current) setSearching(false);
    }
  }, [query]);

  const runSetBrowse = useCallback(async (setId: string) => {
    setSelectedSetId(setId);
    if (!setId) {
      setSetResults([]);
      return;
    }
    const my = ++seq.current;
    setLoadingSet(true);
    setError(null);
    try {
      const cards = await setCards(setId);
      if (my !== seq.current) return;
      setSetResults(cards);
    } catch (e) {
      if (my === seq.current) {
        setError(e instanceof Error ? e.message : "Couldn't load that set — try again in a moment.");
        setSetResults([]);
      }
    } finally {
      if (my === seq.current) setLoadingSet(false);
    }
  }, []);

  const openCard = useCallback(async (card: TcgdexCardSummary) => {
    setViewing(card);
    setViewDetail(null);
    const known = details.get(card.id);
    if (known) {
      setViewDetail(known);
      return;
    }
    setViewLoading(true);
    try {
      const d = await englishDetail(card.id);
      setViewDetail(d);
      if (d) {
        setDetails((prev) => {
          const next = new Map(prev);
          next.set(d.id, d);
          return next;
        });
      }
    } catch {
      setViewDetail(null);
    } finally {
      setViewLoading(false);
    }
  }, [details]);

  const results = mode === "search" ? searchResults : setResults;
  const selectedSet = sets.find((s) => s.id === selectedSetId);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link
        href="/tools"
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        ← All tools
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-slate-800 dark:text-slate-100">
        Card Database
      </h1>
      <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
        Look up any Pokémon card ever printed — search by name or browse a
        whole set, then tap a card for its rarity, variants, and market
        prices. Just browsing? You&apos;re in the right place. Tracking what
        you own and want lives in the{" "}
        <Link
          href="/tools/tcg-collection"
          className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          TCG Collection Tracker
        </Link>
        .
      </p>

      {/* Mode tabs */}
      <div className="mt-8 flex gap-2">
        {(
          [
            { id: "search", label: "Search by name" },
            { id: "set", label: "Browse by set" },
          ] as { id: Mode; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            aria-pressed={mode === t.id}
            className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
              mode === t.id
                ? "bg-emerald-600 text-white ring-emerald-600"
                : "bg-white text-slate-600 ring-slate-200 hover:ring-emerald-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === "search" ? (
        <form
          className="mt-6 flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch();
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “Charizard”, “Eevee”, “Mew”…"
            aria-label="Search cards by Pokémon or card name"
            className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-slate-800 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
          />
          <button
            type="submit"
            disabled={searching || query.trim().length < 2}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
      ) : (
        <div className="mt-6">
          <label
            htmlFor="set-picker"
            className="text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Pick a set
          </label>
          {setsError ? (
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{setsError}</p>
          ) : (
            <select
              id="set-picker"
              value={selectedSetId}
              onChange={(e) => void runSetBrowse(e.target.value)}
              className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-slate-800 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
            >
              <option value="">Choose a set… ({sets.length} sets)</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.total} cards
                </option>
              ))}
            </select>
          )}
          {loadingSet && (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading set…</p>
          )}
          {selectedSet && !loadingSet && setResults.length > 0 && (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {selectedSet.name} · {setResults.length} cards — tap any card for
              rarity, variants, and prices.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      )}

      {mode === "search" && searchedFor && !searching && searchResults.length === 0 && !error && (
        <p className="mt-8 text-slate-500 dark:text-slate-400">
          No cards found for “{searchedFor}”. Check the spelling — the database
          matches English card names.
        </p>
      )}

      {mode === "search" && searchResults.length > 0 && (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          {searchResults.length} {searchResults.length === 1 ? "print" : "prints"} found
          {searchResults.length > detailCount && detailCount > 0
            ? ` — showing prices & rarities for the first ${detailCount}; tap any other card to load its details.`
            : " — tap any card for full details."}
          {searching ? " Loading prices…" : ""}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((card) => {
            const d = details.get(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => void openCard(card)}
                className="group rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-emerald-700"
              >
                {card.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${card.image}/low.webp`}
                    alt={card.name}
                    loading="lazy"
                    className="mx-auto aspect-[63/88] w-full rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex aspect-[63/88] w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400 dark:bg-slate-800">
                    No image
                  </div>
                )}
                <p className="mt-2 truncate font-semibold text-slate-800 dark:text-slate-100">
                  {card.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {d ? `${d.setName} · #${card.localId}` : `#${card.localId}`}
                </p>
                {d && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
                    {d.rarity && (
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        {d.rarity}
                      </span>
                    )}
                    {d.pricing.usd !== null && (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {formatPrice(d.pricing.usd, "USD")}
                      </span>
                    )}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Card detail viewer */}
      {viewing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${viewing.name} details`}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 p-4 sm:items-center"
          onClick={() => setViewing(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {viewing.name}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {viewDetail
                    ? `${viewDetail.setName} · #${viewDetail.localId}`
                    : `#${viewing.localId}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                aria-label="Close card details"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {viewing.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${viewing.image}/high.webp`}
                alt={viewing.name}
                className="mx-auto mt-4 max-h-96 w-auto rounded-xl"
              />
            )}

            {viewLoading && (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Loading card details…
              </p>
            )}

            {viewDetail && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {viewDetail.rarity && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      {viewDetail.rarity}
                    </span>
                  )}
                  {variantBadges(viewDetail.variants).map((b) => (
                    <span
                      key={b}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Market prices
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    USD (TCGplayer
                    {viewDetail.pricing.usdFinish ? ` · ${viewDetail.pricing.usdFinish}` : ""}):{" "}
                    <span className="font-semibold">
                      {formatPrice(viewDetail.pricing.usd, "USD")}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                    EUR (Cardmarket average):{" "}
                    <span className="font-semibold">
                      {formatPrice(viewDetail.pricing.eur, "EUR")}
                    </span>
                  </p>
                  {viewDetail.pricing.updated && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Prices updated {viewDetail.pricing.updated}
                    </p>
                  )}
                </div>
                <Link
                  href="/tools/tcg-collection"
                  className="inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  Track this card in your collection →
                </Link>
              </div>
            )}

            {!viewLoading && !viewDetail && (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Details couldn&apos;t be loaded for this card right now.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
