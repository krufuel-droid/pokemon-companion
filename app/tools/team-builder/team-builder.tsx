"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { getRegionalForms } from "@/lib/data/forms";
import { TYPES, effectiveness } from "@/lib/typechart";
import { typeColor } from "@/lib/theme";
import { TypePills } from "@/app/pokedex/type-pills";

const ALL = getAllSpecies();

/**
 * Regional variants as searchable team-builder entries. They have different
 * typing (and stats) from their base species, so they matter for team
 * analysis — e.g. Alolan Ninetales is Ice/Fairy, not Fire.
 *
 * Synthetic numeric IDs encode the variant: speciesId * 100000 + position
 * in the regional-forms list. Base species max out at id 1025, so any
 * id >= 100000 is a variant and the base dex number is recoverable with
 * Math.floor(id / 100000). Share links and saved teams keep working
 * because everything stays numeric.
 *
 * NOTE: lib/data/forms.ts REGIONALS is append-only — reordering it would
 * renumber variants and break existing share links / saved teams.
 */
const VARIANTS: SpeciesIndex[] = getRegionalForms().map((f, i) => ({
  id: f.speciesId * 100000 + i,
  slug: `${f.speciesId}-${f.region.toLowerCase()}`,
  name: f.formName,
  // forms.ts stores lowercase types; the typechart uses capitalized keys.
  types: f.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
  eggGroups: [],
  sprites: { regular: f.sprite, shiny: f.sprite },
}));

const SEARCHABLE: SpeciesIndex[] = [...ALL, ...VARIANTS];
const BY_ID = new Map<number, SpeciesIndex>(SEARCHABLE.map((s) => [s.id, s]));

/** Display label: base dex number for variants (e.g. "#38"), own id otherwise. */
function dexLabel(s: SpeciesIndex): string {
  return s.id >= 100000 ? `#${Math.floor(s.id / 100000)}` : `#${s.id}`;
}

/**
 * Name search over base species + regional variants. Prefix matches first,
 * then substring matches (so "alola" lists every Alolan form). Max 50.
 */
function searchTeamBuilder(query: string): SpeciesIndex[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const prefix: SpeciesIndex[] = [];
  const substring: SpeciesIndex[] = [];
  for (const s of SEARCHABLE) {
    const name = s.name.toLowerCase();
    if (name.startsWith(q)) prefix.push(s);
    else if (name.includes(q)) substring.push(s);
  }
  return [...prefix, ...substring].slice(0, 50);
}
const STORAGE_KEY = "pc-team-builder-teams";
const MAX_TEAM = 6;

interface SavedTeam {
  name: string;
  ids: number[];
  savedAt: string;
}

function parseTeamParam(param: string | null): number[] {
  if (!param) return [];
  const ids: number[] = [];
  for (const part of param.split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && BY_ID.has(n) && !ids.includes(n)) ids.push(n);
  }
  return ids.slice(0, MAX_TEAM);
}

/** Normalized name → species/variant id, for forgiving PokéPaste matching. */
const NAME_TO_ID = new Map<string, number>();
for (const s of SEARCHABLE) {
  const key = s.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!NAME_TO_ID.has(key)) NAME_TO_ID.set(key, s.id);
}

/** Showdown regional suffixes → builder variant name prefixes. */
const REGION_ALIAS: Array<[RegExp, string]> = [
  [/-alola$/, "alolan "],
  [/-galar$/, "galarian "],
  [/-hisui$/, "hisuian "],
  [/-paldea$/, "paldean "],
];

function matchSpeciesId(raw: string): number | null {
  const q = raw.trim().toLowerCase();
  if (!q) return null;
  for (const [re, prefix] of REGION_ALIAS) {
    if (re.test(q)) {
      const id = NAME_TO_ID.get(
        (prefix + q.replace(re, "")).replace(/[^a-z0-9]/g, ""),
      );
      if (id !== undefined) return id;
    }
  }
  const direct = NAME_TO_ID.get(q.replace(/[^a-z0-9]/g, ""));
  if (direct !== undefined) return direct;
  // Fall back to the base species for forms the builder can't represent
  // (e.g. "charizard-mega-x" → Charizard).
  const dash = q.indexOf("-");
  if (dash > 0) {
    const fallback = NAME_TO_ID.get(q.slice(0, dash).replace(/[^a-z0-9]/g, ""));
    if (fallback !== undefined) return fallback;
  }
  return null;
}

/**
 * Parse PokéPaste / Showdown text into builder species ids.
 * Only species are imported — the builder doesn't store items, moves, EVs,
 * etc. Forgiving: handles "Nickname (Species) @ Item", "Species @ Item",
 * gender "(M)"/"(F)" tags, missing lines, and regional suffixes.
 * Unparseable entries are reported via `skipped`, never invented.
 */
function parsePokePaste(text: string): { ids: number[]; skipped: string[] } {
  const ids: number[] = [];
  const skipped: string[] = [];
  const seen = new Set<number>();
  for (const block of text.split(/\n\s*\n/)) {
    const first = block
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    if (!first || first.startsWith("-") || first.includes(":")) continue;
    // Strip " @ Item".
    let head = first;
    const at = head.lastIndexOf(" @ ");
    if (at > 0) head = head.slice(0, at).trim();
    // Trailing "(...)" — gender tag, species-in-nickname, or form tag.
    let name = head;
    const paren = head.match(/^(.*)\(([^)]+)\)\s*$/);
    if (paren) {
      const inner = paren[2].trim().toLowerCase();
      const outer = paren[1].trim();
      if (inner === "m" || inner === "f") {
        name = outer; // gender tag: "Incineroar (M)"
      } else if (matchSpeciesId(paren[2]) !== null) {
        name = paren[2].trim(); // "Nickname (Species)"
      } else if (outer) {
        name = outer; // unknown tag — try the outer text
      } else {
        name = paren[2].trim();
      }
    }
    const id = matchSpeciesId(name);
    if (id === null) {
      skipped.push(first);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_TEAM) break;
  }
  return { ids, skipped };
}

function loadSaved(): SavedTeam[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedTeam[];
    return Array.isArray(parsed)
      ? parsed.filter((t) => t && typeof t.name === "string" && Array.isArray(t.ids))
      : [];
  } catch {
    return [];
  }
}

function TypeChip({ type, dim }: { type: string; dim?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize text-white ${
        dim ? "opacity-40 saturate-0" : ""
      }`}
      style={{ backgroundColor: typeColor(type) }}
    >
      {type}
    </span>
  );
}

export default function TeamBuilder() {
  const [team, setTeam] = useState<number[]>(() => {
    // Client-only: honor a shared ?team=1,25,94 link without suspending SSR.
    if (typeof window === "undefined") return [];
    return parseTeamParam(new URLSearchParams(window.location.search).get("team"));
  });
  const [query, setQuery] = useState("");
  const [teamName, setTeamName] = useState("");
  const [saved, setSaved] = useState<SavedTeam[]>(() =>
    typeof window === "undefined" ? [] : loadSaved(),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const results = useMemo(() => searchTeamBuilder(query), [query]);

  const members = useMemo(
    () => team.map((id) => BY_ID.get(id)).filter((s): s is SpeciesIndex => Boolean(s)),
    [team],
  );

  const defense = useMemo(
    () =>
      TYPES.map((atk) => {
        let weak = 0;
        let resist = 0;
        let immune = 0;
        for (const m of members) {
          const mult = effectiveness(atk, m.types);
          if (mult === 0) immune += 1;
          else if (mult < 1) resist += 1;
          else if (mult > 1) weak += 1;
        }
        return { type: atk, weak, resist, immune };
      }),
    [members],
  );

  const threats = useMemo(
    () => defense.filter((d) => members.length > 0 && d.weak >= 2 && d.resist === 0 && d.immune === 0),
    [defense, members.length],
  );

  const solid = useMemo(
    () => defense.filter((d) => members.length > 0 && d.weak === 0 && d.resist + d.immune >= 2),
    [defense, members.length],
  );

  const offense = useMemo(
    () =>
      TYPES.map((def) => ({
        type: def,
        covered: members.some((m) => m.types.some((t) => effectiveness(t, [def]) > 1)),
      })),
    [members],
  );

  const uncovered = useMemo(() => offense.filter((o) => !o.covered), [offense]);

  function addSpecies(id: number) {
    if (team.includes(id)) {
      setNotice("That Pokémon is already on the team.");
      return;
    }
    if (team.length >= MAX_TEAM) {
      setNotice("Team is full — remove someone first.");
      return;
    }
    setTeam([...team, id]);
    setQuery("");
  }

  function removeSpecies(id: number) {
    setTeam(team.filter((t) => t !== id));
  }

  function saveTeam() {
    const name = teamName.trim();
    if (!name) {
      setNotice("Give your team a name first.");
      return;
    }
    if (team.length === 0) {
      setNotice("Add at least one Pokémon before saving.");
      return;
    }
    const entry: SavedTeam = { name, ids: [...team], savedAt: new Date().toISOString() };
    const next = [entry, ...saved.filter((s) => s.name !== name)].slice(0, 12);
    setSaved(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setNotice("Could not save — browser storage is unavailable.");
      return;
    }
    setTeamName("");
    setNotice(`Saved "${name}".`);
  }

  function deleteSaved(name: string) {
    const next = saved.filter((s) => s.name !== name);
    setSaved(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* best effort */
    }
  }

  async function copyShareLink() {
    if (team.length === 0) {
      setNotice("Add at least one Pokémon to share.");
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}?team=${team.join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNotice("Copy failed — your browser blocked clipboard access.");
    }
  }

  /** Import a PokéPaste / Showdown team — species only. */
  function importPaste() {
    const { ids, skipped } = parsePokePaste(importText);
    if (ids.length === 0) {
      setNotice("Couldn't recognize any Pokémon in that paste.");
      return;
    }
    setTeam(ids);
    setImportText("");
    setImportOpen(false);
    setNotice(
      `Imported ${ids.length} Pokémon.` +
        (skipped.length > 0
          ? ` Skipped: ${skipped.slice(0, 4).join("; ")}${skipped.length > 4 ? "…" : ""}`
          : ""),
    );
  }

  /** Copy the team in Pokémon Showdown / PokéPaste import format. */
  async function copyShowdown() {
    if (team.length === 0) {
      setNotice("Add at least one Pokémon to export.");
      return;
    }
    const text = team
      .map((id) => BY_ID.get(id)?.name ?? "")
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Showdown format copied — paste it into Showdown's teambuilder or PokéPaste!");
      setTimeout(() => setNotice(null), 4000);
    } catch {
      setNotice("Copy failed — your browser blocked clipboard access.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Team Builder</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Draft a team of up to 6 Pokémon, check its defensive weaknesses and offensive
        coverage, save it, or share it with a link.
      </p>

      {notice && (
        <div className="mt-4 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
          {notice}
        </div>
      )}

      {/* Team slots */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Your team <span className="text-sm font-normal text-slate-400 dark:text-slate-500">{team.length}/6</span>
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyShareLink}
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              {copied ? "Copied!" : "Copy share link"}
            </button>
            <button
              type="button"
              onClick={() => void copyShowdown()}
              title="Copy as Pokémon Showdown import text"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-800"
            >
              Copy Showdown
            </button>
            {team.length > 0 && (
              <button
                type="button"
                onClick={() => setTeam([])}
                className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-600 dark:hover:bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Array.from({ length: MAX_TEAM }, (_, i) => {
            const member = members[i];
            return (
              <div
                key={i}
                className="relative flex min-h-36 flex-col items-center justify-center rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                {member ? (
                  <>
                    <button
                      type="button"
                      aria-label={`Remove ${member.name}`}
                      onClick={() => removeSpecies(member.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-900 dark:hover:text-red-400"
                    >
                      ×
                    </button>
                    <img
                      src={member.sprites.regular}
                      alt={member.name}
                      loading="lazy"
                      className="h-16 w-16"
                    />
                    <span className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {dexLabel(member)} {member.name}
                    </span>
                    <div className="mt-1 scale-90">
                      <TypePills types={member.types} />
                    </div>
                  </>
                ) : (
                  <span className="text-3xl text-slate-300">+</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Search / picker */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Add Pokémon</h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 1,025 Pokémon + regional variants… (e.g. garchomp)"
          className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
        />
        {query.trim().length >= 2 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => addSpecies(s.id)}
                disabled={team.includes(s.id)}
                className="flex items-center gap-3 rounded-xl bg-white p-2 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-emerald-300 disabled:opacity-50 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-emerald-700"
              >
                <img src={s.sprites.regular} alt={s.name} loading="lazy" className="h-12 w-12 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {dexLabel(s)} {s.name}
                  </span>
                  <span className="mt-0.5 flex gap-1">
                    {s.types.map((t) => (
                      <TypeChip key={t} type={t} />
                    ))}
                  </span>
                </span>
              </button>
            ))}
            {results.length === 0 && (
              <p className="col-span-full text-sm text-slate-400 dark:text-slate-500">
                No Pokémon match “{query.trim()}”.
              </p>
            )}
          </div>
        )}
        {query.trim().length < 2 && (
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
            Type at least 2 letters to search the full Pokédex.
          </p>
        )}
      </section>

      {/* Import PokéPaste */}
      <section className="mt-8">
        <button
          type="button"
          onClick={() => setImportOpen((v) => !v)}
          className="text-lg font-semibold text-slate-800 dark:text-slate-100"
        >
          Import PokéPaste{" "}
          <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
            {importOpen ? "▾" : "▸"}
          </span>
        </button>
        {importOpen && (
          <div className="mt-3">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
              placeholder={"Paste a PokéPaste / Showdown team…\n\nGholdengo @ Life Orb\nAbility: Good as Gold\n\nIncineroar (M) @ Sitrus Berry\nAbility: Intimidate"}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={importPaste}
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                Import team
              </button>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Species only — items, moves, and EVs stay in your paste.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Analysis */}
      {members.length > 0 && (
        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Team analysis</h2>

          {threats.length > 0 && (
            <div className="mt-3 rounded-xl bg-red-50 p-3 ring-1 ring-red-200 dark:bg-red-950 dark:ring-red-800">
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">Watch out — no answer to:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {threats.map((d) => (
                  <TypeChip key={d.type} type={d.type} />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-red-700 dark:text-red-300">
                Two or more members are weak to these types and nothing on the team resists them.
              </p>
            </div>
          )}
          {solid.length > 0 && (
            <div className="mt-3 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-800">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Solid against:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {solid.map((d) => (
                  <TypeChip key={d.type} type={d.type} />
                ))}
              </div>
            </div>
          )}

          <h3 className="mt-5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Defensive profile <span className="font-normal text-slate-400 dark:text-slate-500">(weak / resist per attacking type)</span>
          </h3>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {defense.map((d) => {
              const net = d.weak - d.resist - d.immune;
              const tone =
                net > 0
                  ? "bg-red-50 ring-red-200 dark:bg-red-950 dark:ring-red-800"
                  : net < 0
                    ? "bg-emerald-50 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-800"
                    : "bg-stone-50 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700";
              return (
                <div key={d.type} className={`rounded-xl p-2 text-center ring-1 ${tone}`}>
                  <TypeChip type={d.type} />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className={d.weak > 0 ? "font-semibold text-red-600 dark:text-red-400" : ""}>
                      {d.weak} weak
                    </span>
                    {" · "}
                    <span className={d.resist + d.immune > 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
                      {d.resist + d.immune} resist
                    </span>
                  </p>
                </div>
              );
            })}
          </div>

          <h3 className="mt-5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Offensive STAB coverage{" "}
            <span className="font-normal text-slate-400 dark:text-slate-500">
              (types at least one member hits super-effectively with its own type)
            </span>
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {offense.map((o) => (
              <TypeChip key={o.type} type={o.type} dim={!o.covered} />
            ))}
          </div>
          {uncovered.length > 0 ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              No super-effective STAB against:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {uncovered.map((o) => o.type).join(", ")}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Full coverage — the team can hit every type super-effectively!
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            Analysis is based on type matchups only — abilities, movesets, and stats aren’t
            factored in.
          </p>
        </section>
      )}

      {/* Saved teams */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Saved teams</h2>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Name this team…"
            maxLength={40}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
          />
          <button
            type="button"
            onClick={saveTeam}
            className="shrink-0 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            Save
          </button>
        </div>
        {saved.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {saved.map((s) => (
              <li
                key={s.name}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                <div className="flex -space-x-2">
                  {s.ids.slice(0, 6).map((id) => {
                    const sp = BY_ID.get(id);
                    return sp ? (
                      <img
                        key={id}
                        src={sp.sprites.regular}
                        alt={sp.name}
                        title={sp.name}
                        loading="lazy"
                        className="h-10 w-10 rounded-full bg-stone-100 ring-2 ring-white dark:bg-slate-800"
                      />
                    ) : null;
                  })}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {s.name}
                </span>
                <button
                  type="button"
                  onClick={() => setTeam(parseTeamParam(s.ids.join(",")))}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-800"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => deleteSaved(s.name)}
                  aria-label={`Delete ${s.name}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-900 dark:hover:text-red-400"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
            Nothing saved yet — saved teams live in this browser.
          </p>
        )}
      </section>
    </div>
  );
}
