"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import Avatar from "@/components/Avatar";
import CommunityTabs from "@/components/CommunityTabs";
import { unlockAchievement } from "@/lib/achievements";
import { searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { POKEMON_GAMES } from "@/lib/data/games";
import { timeAgo } from "@/lib/community";
import {
  evolvesByTrade,
  fetchTradePosts,
  type TradePost,
} from "@/lib/trade-board";
import {
  CARD_CONDITIONS,
  fetchCardTradePosts,
  languageLabel,
  type CardTradePost,
} from "@/lib/tcg-trade-board";
import { TCGDEX_LANGUAGES } from "@/lib/tcgdex";
import { searchCards as searchTcgCards, type TcgCard } from "@/lib/tcg";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900";
const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";
const labelClass =
  "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

function SignInPrompt() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className={`${cardClass} text-center`}>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          The trade board needs a trainer
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to browse community trade posts and list what you&apos;re
          offering.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

/** Compact species search picker with sprite suggestions. */
function SpeciesPicker({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: SpeciesIndex | null;
  onChange: (s: SpeciesIndex | null) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim();
    if (q.length < 2 || value) return [];
    return searchSpecies(q).slice(0, 8);
  }, [query, value]);

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.sprites.regular}
            alt={value.name}
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {value.name}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="text-sm text-slate-500 underline"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className={inputClass}
          />
          {matches.length > 0 && (
            <ul className="mt-1 grid max-h-44 grid-cols-4 gap-1 overflow-auto rounded-lg border border-stone-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onChange(m)}
                    title={m.name}
                    className="rounded-lg p-1 transition hover:bg-stone-100 dark:hover:bg-slate-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.sprites.regular}
                      alt={m.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain"
                      loading="lazy"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function NewPostForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [offering, setOffering] = useState<SpeciesIndex | null>(null);
  const [looking, setLooking] = useState<SpeciesIndex | null>(null);
  const [game, setGame] = useState<string>(POKEMON_GAMES[0]);
  const [notes, setNotes] = useState("");
  const [evoHelp, setEvoHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickOffering(s: SpeciesIndex | null) {
    setOffering(s);
    if (s && evolvesByTrade(s.id)) setEvoHelp(true);
  }
  function pickLooking(s: SpeciesIndex | null) {
    setLooking(s);
    if (s && evolvesByTrade(s.id)) setEvoHelp(true);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!user || !offering || !looking || busy) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("trade_posts").insert({
        user_id: user.id,
        offering_species_id: offering.id,
        offering_name: offering.name,
        looking_species_id: looking.id,
        looking_name: looking.name,
        game,
        notes: notes.trim() || null,
        evo_help: evoHelp,
        status: "open",
      });
      if (error) throw error;
      setOffering(null);
      setLooking(null);
      setGame(POKEMON_GAMES[0]);
      setNotes("");
      setEvoHelp(false);
      setOpen(false);
      onCreated();
      // Fire-and-forget: never let achievement tracking break posting.
      void unlockAchievement(user.id, "first-trade-post").catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the post.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-stone-300 bg-white/50 p-5 text-center font-semibold text-slate-500 transition hover:border-mint hover:text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ➕ New trade post
      </button>
    );
  }

  return (
    <form onSubmit={(ev) => void create(ev)} className={cardClass}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        New trade post
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SpeciesPicker
          label="Offering"
          value={offering}
          onChange={pickOffering}
          placeholder="Search the Pokémon you're offering…"
        />
        <SpeciesPicker
          label="Looking for"
          value={looking}
          onChange={pickLooking}
          placeholder="Search the Pokémon you want…"
        />
      </div>
      <div className="mt-4">
        <label htmlFor="trade-game" className={labelClass}>
          Game
        </label>
        <select
          id="trade-game"
          value={game}
          onChange={(e) => setGame(e.target.value)}
          className={inputClass}
        >
          {POKEMON_GAMES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <label htmlFor="trade-notes" className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id="trade-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          maxLength={280}
          placeholder="Shiny, nature, IVs, timing…"
        />
      </div>
      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={evoHelp}
          onChange={(e) => setEvoHelp(e.target.checked)}
          className="h-4 w-4 accent-emerald-600"
        />
        🔄 Trade-evolution help — happy to trade &amp; trade back
      </label>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !offering || !looking}
          className="rounded-lg bg-mint px-6 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
        >
          {busy ? "Posting…" : "Post trade"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}
    </form>
  );
}

function PostCard({
  post,
  userId,
  onChanged,
}: {
  post: TradePost;
  userId: string;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const mine = post.user_id === userId;

  async function setStatus(status: "open" | "fulfilled") {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("trade_posts")
        .update({ status })
        .eq("id", post.id);
      if (!error) {
        onChanged();
        if (status === "fulfilled" && user) {
          // Fire-and-forget.
          void unlockAchievement(user.id, "trade-fulfilled").catch(() => {});
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("trade_posts").delete().eq("id", post.id);
      if (!error) onChanged();
      else console.error("Delete failed:", error.message);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <article
      className={`${cardClass} ${post.status === "fulfilled" ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          username={post.author?.username ?? "?"}
          avatarUrl={post.author?.avatar_url ?? undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {post.author?.username ?? "Unknown trainer"}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {timeAgo(post.created_at)}
            </span>
            {post.evo_help && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                🔄 Trade-evo help
              </span>
            )}
            {post.status === "fulfilled" && (
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                Fulfilled
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Link
              href={`/pokemon/${post.offering_species_id}`}
              className="flex items-center gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${post.offering_species_id}.png`}
                alt={post.offering_name}
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
                loading="lazy"
              />
            </Link>
            <span
              aria-hidden
              className="text-2xl font-black text-mint dark:text-mint"
            >
              →
            </span>
            <Link
              href={`/pokemon/${post.looking_species_id}`}
              className="flex items-center gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${post.looking_species_id}.png`}
                alt={post.looking_name}
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
                loading="lazy"
              />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {post.offering_name} <span className="text-slate-400">→</span>{" "}
                {post.looking_name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {post.game}
              </p>
            </div>
          </div>
          {post.notes && (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-400">
              {post.notes}
            </p>
          )}
          {mine && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {post.status === "open" ? (
                <button
                  type="button"
                  onClick={() => void setStatus("fulfilled")}
                  disabled={busy}
                  className="rounded-lg bg-mint px-3 py-1.5 text-xs font-bold text-slate-900 disabled:opacity-60 dark:text-slate-100"
                >
                  ✅ Mark fulfilled
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void setStatus("open")}
                  disabled={busy}
                  className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-stone-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300"
                >
                  Reopen
                </button>
              )}
              {confirming ? (
                <>
                  <button
                    type="button"
                    onClick={() => void remove()}
                    disabled={busy}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* TCG card trading board (Cards sub-tab)                             */
/* ------------------------------------------------------------------ */

interface CardSide {
  name: string;
  set: string;
  language: string;
  condition: string;
}

const emptyCardSide = (condition = "Near Mint"): CardSide => ({
  name: "",
  set: "",
  language: "en",
  condition,
});

/** Card name input with autocomplete suggestions (prefills the set). */
function CardNameField({
  id,
  label,
  side,
  onChange,
}: {
  id: string;
  label: string;
  side: CardSide;
  onChange: (s: CardSide) => void;
}) {
  const [suggestions, setSuggestions] = useState<TcgCard[]>([]);
  const timer = useMemo(() => ({ current: 0 as unknown as ReturnType<typeof setTimeout> }), []);

  function handleName(name: string) {
    const match = suggestions.find(
      (s) => s.name.toLowerCase() === name.trim().toLowerCase()
    );
    onChange({
      ...side,
      name,
      set: match?.setName && !side.set ? match.setName : side.set,
    });
    clearTimeout(timer.current);
    if (name.trim().length >= 2) {
      timer.current = setTimeout(() => {
        searchTcgCards(name.trim())
          .then((cards) => setSuggestions(cards.slice(0, 8)))
          .catch(() => setSuggestions([]));
      }, 400);
    } else {
      setSuggestions([]);
    }
  }

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        value={side.name}
        onChange={(e) => handleName(e.target.value)}
        placeholder="e.g. Charizard"
        autoComplete="off"
        list={`${id}-suggestions`}
        className={inputClass}
      />
      <datalist id={`${id}-suggestions`}>
        {suggestions.map((s) => (
          <option key={s.id} value={s.name}>
            {s.setName}
          </option>
        ))}
      </datalist>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <input
          value={side.set}
          onChange={(e) => onChange({ ...side, set: e.target.value })}
          placeholder="Set (optional)"
          aria-label={`${label} set`}
          className={inputClass}
        />
        <select
          value={side.language}
          onChange={(e) => onChange({ ...side, language: e.target.value })}
          aria-label={`${label} language`}
          className={inputClass}
        >
          {TCGDEX_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <select
          value={side.condition}
          onChange={(e) => onChange({ ...side, condition: e.target.value })}
          aria-label={`${label} condition`}
          className={inputClass}
        >
          {CARD_CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function NewCardPostForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [offering, setOffering] = useState<CardSide>(() => emptyCardSide());
  const [looking, setLooking] = useState<CardSide>(() => emptyCardSide(""));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!user || !offering.name.trim() || !looking.name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("tcg_trade_posts").insert({
        user_id: user.id,
        offering_card_name: offering.name.trim(),
        offering_set: offering.set.trim() || null,
        offering_language: offering.language,
        offering_condition: offering.condition,
        looking_card_name: looking.name.trim(),
        looking_set: looking.set.trim() || null,
        looking_language: looking.language,
        looking_condition: looking.condition || null,
        notes: notes.trim() || null,
        status: "open",
      });
      if (error) throw error;
      setOffering(emptyCardSide());
      setLooking(emptyCardSide(""));
      setNotes("");
      setOpen(false);
      onCreated();
      void unlockAchievement(user.id, "first-card-trade").catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the post.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-stone-300 bg-white/50 p-5 text-center font-semibold text-slate-500 transition hover:border-mint hover:text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ➕ New card trade post
      </button>
    );
  }

  return (
    <form onSubmit={(ev) => void create(ev)} className={cardClass}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        New card trade post
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <CardNameField
          id="card-offering"
          label="Offering"
          side={offering}
          onChange={setOffering}
        />
        <CardNameField
          id="card-looking"
          label="Looking for"
          side={looking}
          onChange={setLooking}
        />
      </div>
      <div className="mt-4">
        <label htmlFor="card-trade-notes" className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id="card-trade-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          maxLength={280}
          placeholder="Shipping, grading, sealed vs loose…"
        />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !offering.name.trim() || !looking.name.trim()}
          className="rounded-lg bg-mint px-6 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
        >
          {busy ? "Posting…" : "Post card trade"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}
    </form>
  );
}

function CardPostCard({
  post,
  userId,
  onChanged,
}: {
  post: CardTradePost;
  userId: string;
  onChanged: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const mine = post.user_id === userId;

  async function setStatus(status: "open" | "fulfilled") {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tcg_trade_posts")
        .update({ status })
        .eq("id", post.id);
      if (!error) onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("tcg_trade_posts").delete().eq("id", post.id);
      if (!error) onChanged();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  function sideLine(
    name: string,
    set: string | null,
    language: string,
    condition: string | null
  ) {
    return (
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
          🃏 {name}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {[set, languageLabel(language), condition].filter(Boolean).join(" · ")}
        </p>
      </div>
    );
  }

  return (
    <article
      className={`${cardClass} ${post.status === "fulfilled" ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          username={post.author?.username ?? "?"}
          avatarUrl={post.author?.avatar_url ?? undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {post.author?.username ?? "Unknown trainer"}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {timeAgo(post.created_at)}
            </span>
            {post.status === "fulfilled" && (
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                Fulfilled
              </span>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            {sideLine(
              post.offering_card_name,
              post.offering_set,
              post.offering_language,
              post.offering_condition
            )}
            <span aria-hidden className="text-xl font-black text-mint dark:text-mint">
              →
            </span>
            {sideLine(
              post.looking_card_name,
              post.looking_set,
              post.looking_language,
              post.looking_condition
            )}
          </div>
          {post.notes && (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-400">
              {post.notes}
            </p>
          )}
          {mine && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {post.status === "open" ? (
                <button
                  type="button"
                  onClick={() => void setStatus("fulfilled")}
                  disabled={busy}
                  className="rounded-lg bg-mint px-3 py-1.5 text-xs font-bold text-slate-900 disabled:opacity-60 dark:text-slate-100"
                >
                  ✅ Mark fulfilled
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void setStatus("open")}
                  disabled={busy}
                  className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-stone-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300"
                >
                  Reopen
                </button>
              )}
              {confirming ? (
                <>
                  <button
                    type="button"
                    onClick={() => void remove()}
                    disabled={busy}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CardTradeBoard({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<CardTradePost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [missing, setMissing] = useState(false);
  const [query, setQuery] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [setFilter, setSetFilter] = useState("all");

  const refreshPosts = useCallback(() => {
    const supabase = createClient();
    void fetchCardTradePosts(supabase)
      .then((rows) => {
        setPosts(rows);
        setMissing(false);
        setLoadingFeed(false);
      })
      .catch(() => {
        setMissing(true);
        setLoadingFeed(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    void fetchCardTradePosts(supabase)
      .then((rows) => {
        if (cancelled) return;
        setPosts(rows);
        setMissing(false);
        setLoadingFeed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setMissing(true);
        setLoadingFeed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sets = useMemo(() => {
    const s = new Set<string>();
    for (const p of posts) {
      if (p.offering_set) s.add(p.offering_set);
      if (p.looking_set) s.add(p.looking_set);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (langFilter !== "all" && p.offering_language !== langFilter && p.looking_language !== langFilter)
        return false;
      if (
        setFilter !== "all" &&
        p.offering_set !== setFilter &&
        p.looking_set !== setFilter
      )
        return false;
      if (
        q &&
        !p.offering_card_name.toLowerCase().includes(q) &&
        !p.looking_card_name.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [posts, query, langFilter, setFilter]);

  if (missing) {
    return (
      <div className={cardClass}>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Card trading isn&apos;t set up yet
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          The app owner needs to run{" "}
          <code className="rounded bg-stone-100 px-1 text-xs dark:bg-slate-800">
            supabase/migration-tcg-master-set.sql
          </code>{" "}
          in the Supabase SQL Editor, then this board will light up.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <NewCardPostForm onCreated={() => void refreshPosts()} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter by language"
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="w-auto rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">All languages</option>
          {TCGDEX_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by set"
          value={setFilter}
          onChange={(e) => setSetFilter(e.target.value)}
          className="w-auto max-w-48 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">All sets</option>
          {sets.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search card names…"
          autoComplete="off"
          aria-label="Search card trade posts"
          className="min-w-36 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {loadingFeed ? (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          Loading card trades…
        </p>
      ) : filtered.length === 0 ? (
        <div className={cardClass}>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {posts.length === 0
              ? "No card trades yet — be the first to post one! 🃏"
              : "Nothing matches those filters. Try widening them."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <CardPostCard
              key={post.id}
              post={post}
              userId={userId}
              onChanged={() => void refreshPosts()}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function TradeBoardPage() {
  const { configured, loading, user } = useAuth();
  const [posts, setPosts] = useState<TradePost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [missing, setMissing] = useState(false);

  const [gameFilter, setGameFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [evoOnly, setEvoOnly] = useState(false);
  const [board, setBoard] = useState<"pokemon" | "cards">("pokemon");

  /** Manual refresh used after creating, updating, or deleting a post. */
  const refreshPosts = useCallback(() => {
    if (!user) return;
    const supabase = createClient();
    void fetchTradePosts(supabase)
      .then((rows) => {
        setPosts(rows);
        setMissing(false);
        setLoadingFeed(false);
      })
      .catch(() => {
        // trade_posts table doesn't exist yet (SQL not run) — hint, don't crash.
        setMissing(true);
        setLoadingFeed(false);
      });
  }, [user]);

  // Initial load once auth is ready. State updates happen in the promise
  // continuation (after the network round-trip), never synchronously.
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    const supabase = createClient();
    void fetchTradePosts(supabase)
      .then((rows) => {
        if (cancelled) return;
        setPosts(rows);
        setMissing(false);
        setLoadingFeed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setMissing(true);
        setLoadingFeed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (gameFilter !== "all" && p.game !== gameFilter) return false;
      if (evoOnly && !p.evo_help) return false;
      if (
        q &&
        !p.offering_name.toLowerCase().includes(q) &&
        !p.looking_name.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [posts, gameFilter, query, evoOnly]);

  if (!isSupabaseConfigured()) return <SupabaseNeeded />;
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading the trade board…
      </div>
    );
  }
  if (!configured || !user) return <SignInPrompt />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <CommunityTabs />

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            🔁 Trade board
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Community-wide trading — list what you&apos;re offering and what
            you&apos;re hunting, or help a trainer finish a trade evolution.
          </p>
        </div>
      </div>

      {/* Board selector: Pokémon game trades vs TCG card trades */}
      <div
        role="tablist"
        aria-label="Trade boards"
        className="mb-6 flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-slate-800"
      >
        {(
          [
            { id: "pokemon", label: "🔁 Pokémon" },
            { id: "cards", label: "🃏 Cards" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={board === t.id}
            onClick={() => setBoard(t.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              board === t.id
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {board === "cards" ? (
        <CardTradeBoard userId={user.id} />
      ) : missing ? (
        <div className={cardClass}>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            The trade board isn&apos;t set up yet
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            The app owner needs to run{" "}
            <code className="rounded bg-stone-100 px-1 text-xs dark:bg-slate-800">
              supabase/migration-trade-board.sql
            </code>{" "}
            in the Supabase SQL Editor, then this page will light up.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <NewPostForm onCreated={() => void refreshPosts()} />
          </div>

          {/* Compact filter row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by game"
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="w-auto rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">All games</option>
              {POKEMON_GAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search offering / looking…"
              autoComplete="off"
              aria-label="Search trade posts"
              className="min-w-36 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <input
                type="checkbox"
                checked={evoOnly}
                onChange={(e) => setEvoOnly(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              🔄 Evo help only
            </label>
          </div>

          {loadingFeed ? (
            <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading posts…
            </p>
          ) : filtered.length === 0 ? (
            <div className={cardClass}>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                {posts.length === 0
                  ? "No trade posts yet — be the first to post one! 🎉"
                  : "Nothing matches those filters. Try widening them."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  userId={user.id}
                  onChanged={() => void refreshPosts()}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
