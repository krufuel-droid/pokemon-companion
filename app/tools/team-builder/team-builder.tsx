"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { getRegionalForms } from "@/lib/data/forms";
import { TYPES, effectiveness } from "@/lib/typechart";
import { typeColor } from "@/lib/theme";
import { TypePills } from "@/app/pokedex/type-pills";
import { NATURES } from "@/lib/data/natures";
import { ITEMS } from "@/lib/data/items";
import { MOVES } from "@/lib/data/moves";
import { buildRentalUrl, decodeSharedTeam } from "@/lib/rental-teams";

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

/** Species/variant lookup shared with the rental-teams page. */
export function lookupSpecies(id: number): SpeciesIndex | undefined {
  return BY_ID.get(id);
}

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

// ---------------------------------------------------------------------------
// Team member model: a full competitive set. Every field except speciesId is
// optional so old species-only teams (and fresh picks) keep working.
// ---------------------------------------------------------------------------
export interface StatSpread {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface TeamMember {
  speciesId: number;
  nickname?: string;
  item?: string;
  ability?: string;
  nature?: string;
  /** Defaults to 50 (VGC) when unset. */
  level?: number;
  evs?: StatSpread;
  ivs?: StatSpread;
  /** Up to 4 move names. */
  moves?: string[];
}

const EV_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
type EvKey = (typeof EV_KEYS)[number];
const EV_LABELS: Record<EvKey, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};
const ZERO_EVS: StatSpread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
const FULL_IVS: StatSpread = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
const MAX_EV_TOTAL = 510;
const MAX_EV_STAT = 252;

function displayName(m: TeamMember, species: SpeciesIndex): string {
  const nick = m.nickname?.trim();
  return nick ? nick : species.name;
}

// ---------------------------------------------------------------------------
// Saved teams. Pre-upgrade entries stored `{ name, ids: number[] }` —
// converted to full-set members (with empty sets) on load.
// ---------------------------------------------------------------------------
interface SavedTeam {
  name: string;
  members: TeamMember[];
  savedAt: string;
}

interface LegacySavedTeam {
  name: string;
  ids: number[];
  savedAt: string;
}

function loadSaved(): SavedTeam[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<SavedTeam | LegacySavedTeam>;
    if (!Array.isArray(parsed)) return [];
    const out: SavedTeam[] = [];
    for (const t of parsed) {
      if (!t || typeof t.name !== "string") continue;
      let members: TeamMember[] = [];
      if (Array.isArray((t as SavedTeam).members)) {
        members = (t as SavedTeam).members.filter((m) => m && BY_ID.has(m.speciesId));
      } else if (Array.isArray((t as LegacySavedTeam).ids)) {
        members = (t as LegacySavedTeam).ids
          .filter((id) => BY_ID.has(id))
          .map((id) => ({ speciesId: id }));
      }
      if (members.length === 0) continue;
      out.push({
        name: t.name,
        members: members.slice(0, MAX_TEAM),
        savedAt: typeof t.savedAt === "string" ? t.savedAt : "",
      });
    }
    return out;
  } catch {
    return [];
  }
}

/** Old-style ?team=1,25,94 links resolve to bare species ids, then wrapped. */
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

/** Forgiving stat-name lookup for "EVs:" / "IVs:" lines. */
const STAT_ALIAS: Record<string, EvKey> = {
  hp: "hp",
  atk: "atk",
  attack: "atk",
  def: "def",
  defense: "def",
  spa: "spa",
  spatk: "spa",
  specialattack: "spa",
  spd: "spd",
  spdef: "spd",
  specialdefense: "spd",
  spe: "spe",
  speed: "spe",
};

/** Parse "252 Atk / 4 SpD / 252 Spe" into a partial spread. */
function parseSpread(text: string): Partial<StatSpread> {
  const out: Partial<StatSpread> = {};
  for (const part of text.split("/")) {
    const mm = part.trim().match(/^(\d+)\s+([a-zA-Z.\s]+)$/);
    if (!mm) continue;
    const val = Number(mm[1]);
    if (!Number.isFinite(val)) continue;
    const stat = STAT_ALIAS[mm[2].toLowerCase().replace(/[^a-z]/g, "")];
    if (stat) out[stat] = val;
  }
  return out;
}

/**
 * Parse PokéPaste / Showdown text into full team members: nickname, item,
 * ability, level, nature, EVs, IVs, and up to 4 moves. Forgiving: handles
 * "Nickname (Species) @ Item", "Species @ Item", gender "(M)"/"(F)" tags,
 * regional suffixes, and missing lines. Unparseable entries are reported
 * via `skipped`, never invented; unrecognized lines inside a set (Tera
 * Type, Shiny, Happiness, ...) are silently ignored.
 */
function parsePokePaste(text: string): { members: TeamMember[]; skipped: string[] } {
  const members: TeamMember[] = [];
  const skipped: string[] = [];
  const seen = new Set<number>();
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) continue;
    const first = lines[0];
    if (first.startsWith("-") || first.includes(":")) continue;

    // Head line: optional "Nickname (Species)", optional " @ Item".
    let head = first;
    let item: string | undefined;
    const at = head.lastIndexOf(" @ ");
    if (at > 0) {
      const after = head.slice(at + 3).trim();
      if (after) item = after;
      head = head.slice(0, at).trim();
    }
    let name = head;
    let nickname: string | undefined;
    const paren = head.match(/^(.*)\(([^)]+)\)\s*$/);
    if (paren) {
      const inner = paren[2].trim();
      const outer = paren[1].trim();
      const innerLower = inner.toLowerCase();
      if (innerLower === "m" || innerLower === "f") {
        name = outer; // gender tag: "Incineroar (M)"
      } else if (matchSpeciesId(inner) !== null) {
        name = inner; // "Nickname (Species)"
        if (outer) nickname = outer;
      } else if (outer) {
        name = outer; // unknown tag — try the outer text
      } else {
        name = inner;
      }
    }

    const id = matchSpeciesId(name);
    if (id === null) {
      skipped.push(first);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);

    const member: TeamMember = { speciesId: id };
    if (nickname) member.nickname = nickname;
    if (item) member.item = item;
    const moves: string[] = [];
    for (const line of lines.slice(1)) {
      if (line.startsWith("-")) {
        if (moves.length < 4) {
          const mv = line.slice(1).trim();
          if (mv) moves.push(mv);
        }
        continue;
      }
      let mm = line.match(/^ability:\s*(.+)$/i);
      if (mm) {
        member.ability = mm[1].trim();
        continue;
      }
      mm = line.match(/^level:\s*(\d+)/i);
      if (mm) {
        member.level = Math.min(100, Math.max(1, parseInt(mm[1], 10)));
        continue;
      }
      mm = line.match(/^evs:\s*(.+)$/i);
      if (mm) {
        const parsed = parseSpread(mm[1]);
        const evs = { ...ZERO_EVS };
        for (const k of EV_KEYS) {
          const v = parsed[k];
          if (v !== undefined) evs[k] = Math.min(MAX_EV_STAT, Math.max(0, Math.round(v)));
        }
        member.evs = evs;
        continue;
      }
      mm = line.match(/^ivs:\s*(.+)$/i);
      if (mm) {
        const parsed = parseSpread(mm[1]);
        const ivs = { ...FULL_IVS };
        for (const k of EV_KEYS) {
          const v = parsed[k];
          if (v !== undefined) ivs[k] = Math.min(31, Math.max(0, Math.round(v)));
        }
        member.ivs = ivs;
        continue;
      }
      mm = line.match(/^([a-zA-Z]+)\s+nature$/i);
      if (mm) {
        const n = NATURES.find((x) => x.name.toLowerCase() === mm![1].toLowerCase());
        if (n) member.nature = n.name;
        continue;
      }
    }
    if (moves.length > 0) member.moves = moves;
    members.push(member);
    if (members.length >= MAX_TEAM) break;
  }
  return { members, skipped };
}

/** Serialize one member to valid PokéPaste / Showdown import text. */
function memberToShowdown(m: TeamMember): string {
  const speciesName = BY_ID.get(m.speciesId)?.name ?? "";
  const lines: string[] = [];
  const nickname = m.nickname?.trim();
  const item = m.item?.trim();
  lines.push(
    `${nickname ? `${nickname} (${speciesName})` : speciesName}${item ? ` @ ${item}` : ""}`,
  );
  const ability = m.ability?.trim();
  if (ability) lines.push(`Ability: ${ability}`);
  // Showdown defaults to level 100, so always state it (our default is 50).
  lines.push(`Level: ${m.level ?? 50}`);
  const evs = { ...ZERO_EVS, ...m.evs };
  const evParts = EV_KEYS.filter((k) => evs[k] > 0).map((k) => `${evs[k]} ${EV_LABELS[k]}`);
  if (evParts.length > 0) lines.push(`EVs: ${evParts.join(" / ")}`);
  if (m.nature) lines.push(`${m.nature} Nature`);
  const ivs = { ...FULL_IVS, ...m.ivs };
  if (EV_KEYS.some((k) => ivs[k] !== 31)) {
    lines.push(`IVs: ${EV_KEYS.map((k) => `${ivs[k]} ${EV_LABELS[k]}`).join(" / ")}`);
  }
  for (const mv of (m.moves ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4)) {
    lines.push(`- ${mv}`);
  }
  return lines.join("\n");
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

function shortStat(s: string): string {
  return s
    .replace("Sp. Atk", "SpA")
    .replace("Sp. Def", "SpD")
    .replace("Attack", "Atk")
    .replace("Defense", "Def")
    .replace("Speed", "Spe");
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800";
const labelClass = "block text-xs font-medium text-slate-500 dark:text-slate-400";

/** Collapsible per-member set editor: nickname, item, ability, nature, level, EVs, IVs, moves. */
function SetEditor({
  member,
  species,
  onChange,
}: {
  member: TeamMember;
  species: SpeciesIndex;
  onChange: (patch: Partial<TeamMember>) => void;
}) {
  const [open, setOpen] = useState(false);
  const evs = { ...ZERO_EVS, ...member.evs };
  const ivs = { ...FULL_IVS, ...member.ivs };
  const moves = [0, 1, 2, 3].map((i) => member.moves?.[i] ?? "");
  const evTotal = EV_KEYS.reduce((sum, k) => sum + evs[k], 0);
  const evInvalid = evTotal > MAX_EV_TOTAL || EV_KEYS.some((k) => evs[k] > MAX_EV_STAT);

  const summary = [
    member.item?.trim() ? `@ ${member.item.trim()}` : null,
    member.nature ?? null,
    member.ability?.trim() || null,
  ].filter(Boolean) as string[];

  const setEv = (k: EvKey, v: number) =>
    onChange({ evs: { ...evs, [k]: Math.max(0, Math.round(v) || 0) } });
  const setIv = (k: EvKey, v: number) =>
    onChange({ ivs: { ...ivs, [k]: Math.min(31, Math.max(0, Math.round(v) || 0)) } });
  const setMove = (i: number, v: string) => {
    const next = [...moves];
    next[i] = v;
    onChange({ moves: next });
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <img src={species.sprites.regular} alt={species.name} loading="lazy" className="h-10 w-10 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
            {dexLabel(species)} {displayName(member, species)}
          </span>
          {summary.length > 0 && (
            <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
              {summary.join(" · ")}
            </span>
          )}
        </span>
        <span className="shrink-0 text-sm text-slate-400 dark:text-slate-500">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <label className={labelClass}>
              Nickname
              <input
                type="text"
                value={member.nickname ?? ""}
                maxLength={20}
                onChange={(e) => onChange({ nickname: e.target.value || undefined })}
                placeholder={species.name}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Item
              <input
                type="text"
                value={member.item ?? ""}
                list="pc-builder-items"
                onChange={(e) => onChange({ item: e.target.value || undefined })}
                placeholder="Life Orb…"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Ability
              <input
                type="text"
                value={member.ability ?? ""}
                onChange={(e) => onChange({ ability: e.target.value || undefined })}
                placeholder="Intimidate…"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Nature
              <select
                value={member.nature ?? ""}
                onChange={(e) => onChange({ nature: e.target.value || undefined })}
                className={inputClass}
              >
                <option value="">—</option>
                {NATURES.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.name}
                    {n.raises ? ` (+${shortStat(n.raises)} −${shortStat(n.lowers ?? "")})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Level
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={member.level ?? 50}
                onChange={(e) =>
                  onChange({
                    level: Math.min(100, Math.max(1, Math.round(Number(e.target.value) || 50))),
                  })
                }
                className={inputClass}
              />
            </label>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">EVs</span>
              <span
                className={`text-xs ${evInvalid ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}
              >
                {evTotal} / {MAX_EV_TOTAL}
              </span>
            </div>
            {evInvalid && (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {evTotal > MAX_EV_TOTAL
                  ? `EV total is ${evTotal} — the cap is 510.`
                  : "A single stat can't hold more than 252 EVs."}
              </p>
            )}
            <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {EV_KEYS.map((k) => (
                <label key={k} className={labelClass}>
                  {EV_LABELS[k]}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={252}
                    value={evs[k]}
                    onChange={(e) => setEv(k, Number(e.target.value))}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">IVs</span>
            <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {EV_KEYS.map((k) => (
                <label key={k} className={labelClass}>
                  {EV_LABELS[k]}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={31}
                    value={ivs[k]}
                    onChange={(e) => setIv(k, Number(e.target.value))}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Moves</span>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {moves.map((mv, i) => (
                <input
                  key={i}
                  type="text"
                  value={mv}
                  list="pc-builder-moves"
                  maxLength={40}
                  onChange={(e) => setMove(i, e.target.value)}
                  placeholder={`Move ${i + 1}`}
                  aria-label={`Move ${i + 1}`}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamBuilder() {
  const [team, setTeam] = useState<TeamMember[]>(() => {
    // Client-only: honor shared links without suspending SSR. ?fullteam=
    // carries full rental sets (base64url JSON); legacy ?team=1,25,94 is
    // species-id-only and still works.
    if (typeof window === "undefined") return [];
    const params = new URLSearchParams(window.location.search);
    const full = (decodeSharedTeam(params.get("fullteam")) ?? []).filter((m) =>
      BY_ID.has(m.speciesId),
    );
    if (full.length > 0) return full;
    return parseTeamParam(params.get("team")).map((id) => ({ speciesId: id }));
  });
  const [query, setQuery] = useState("");
  const [teamName, setTeamName] = useState("");
  const [saved, setSaved] = useState<SavedTeam[]>(() =>
    typeof window === "undefined" ? [] : loadSaved(),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rentalCopied, setRentalCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const results = useMemo(() => searchTeamBuilder(query), [query]);

  const members = useMemo(
    () => team.map((m) => BY_ID.get(m.speciesId)).filter((s): s is SpeciesIndex => Boolean(s)),
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
    if (team.some((m) => m.speciesId === id)) {
      setNotice("That Pokémon is already on the team.");
      return;
    }
    if (team.length >= MAX_TEAM) {
      setNotice("Team is full — remove someone first.");
      return;
    }
    setTeam([...team, { speciesId: id }]);
    setQuery("");
  }

  function removeMember(index: number) {
    setTeam(team.filter((_, i) => i !== index));
  }

  function updateMember(index: number, patch: Partial<TeamMember>) {
    setTeam((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
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
    const entry: SavedTeam = {
      name,
      members: team.map((m) => ({ ...m })),
      savedAt: new Date().toISOString(),
    };
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
    // Share links stay species-id-only: full sets would bloat the URL and
    // break compatibility with older links. Recipients get the species and
    // fill in their own sets.
    const url = `${window.location.origin}${window.location.pathname}?team=${team.map((m) => m.speciesId).join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNotice("Copy failed — your browser blocked clipboard access.");
    }
  }

  /** Copy a rental-team link with FULL sets (items, moves, EVs) — opens at /tools/rental-teams. */
  async function copyRentalLink() {
    if (team.length === 0) {
      setNotice("Add at least one Pokémon to share.");
      return;
    }
    const url = buildRentalUrl(window.location.origin, team);
    try {
      await navigator.clipboard.writeText(url);
      setRentalCopied(true);
      setTimeout(() => setRentalCopied(false), 2500);
    } catch {
      setNotice("Copy failed — your browser blocked clipboard access.");
    }
  }

  /** Import a PokéPaste / Showdown team with full sets. */
  function importPaste() {
    const { members, skipped } = parsePokePaste(importText);
    if (members.length === 0) {
      setNotice("Couldn't recognize any Pokémon in that paste.");
      return;
    }
    setTeam(members);
    setImportText("");
    setImportOpen(false);
    setNotice(
      `Imported ${members.length} full set${members.length === 1 ? "" : "s"}.` +
        (skipped.length > 0
          ? ` Skipped: ${skipped.slice(0, 4).join("; ")}${skipped.length > 4 ? "…" : ""}`
          : ""),
    );
  }

  /** Copy the team (with full sets) in Pokémon Showdown / PokéPaste import format. */
  async function copyShowdown() {
    if (team.length === 0) {
      setNotice("Add at least one Pokémon to export.");
      return;
    }
    const text = team.map(memberToShowdown).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Full team copied in Showdown format — paste it into Showdown's teambuilder or PokéPaste!");
      setTimeout(() => setNotice(null), 4000);
    } catch {
      setNotice("Copy failed — your browser blocked clipboard access.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Team Builder</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Draft a team of up to 6 Pokémon with full competitive sets, check its defensive
        weaknesses and offensive coverage, save it, or share it with a link.
      </p>

      {/* Shared suggestion lists for the set editors (free text still allowed). */}
      <datalist id="pc-builder-items">
        {ITEMS.map((i) => (
          <option key={i.name} value={i.name} />
        ))}
      </datalist>
      <datalist id="pc-builder-moves">
        {MOVES.map((m) => (
          <option key={m.name} value={m.name} />
        ))}
      </datalist>

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
              onClick={copyRentalLink}
              title="Copy a rental-team link with full sets (items, moves, EVs)"
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              {rentalCopied ? "Copied!" : "Share as link"}
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
            const entry = team[i];
            const species = entry ? BY_ID.get(entry.speciesId) : undefined;
            return (
              <div
                key={i}
                className="relative flex min-h-36 flex-col items-center justify-center rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                {species && entry ? (
                  <>
                    <button
                      type="button"
                      aria-label={`Remove ${displayName(entry, species)}`}
                      onClick={() => removeMember(i)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-900 dark:hover:text-red-400"
                    >
                      ×
                    </button>
                    <img
                      src={species.sprites.regular}
                      alt={species.name}
                      loading="lazy"
                      className="h-16 w-16"
                    />
                    <span className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {dexLabel(species)} {displayName(entry, species)}
                    </span>
                    <div className="mt-1 scale-90">
                      <TypePills types={species.types} />
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

      {/* Set details */}
      {team.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Set details</h2>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Optional — expand a Pokémon to add its item, ability, nature, EVs, IVs, and moves.
          </p>
          <div className="mt-3 space-y-2">
            {team.map((m, i) => {
              const species = BY_ID.get(m.speciesId);
              if (!species) return null;
              return (
                <SetEditor
                  key={`${m.speciesId}-${i}`}
                  member={m}
                  species={species}
                  onChange={(patch) => updateMember(i, patch)}
                />
              );
            })}
          </div>
        </section>
      )}

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
                disabled={team.some((m) => m.speciesId === s.id)}
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
              placeholder={"Paste a PokéPaste / Showdown team…\n\nGholdengo @ Life Orb\nAbility: Good as Gold\nLevel: 50\nEVs: 252 HP / 252 SpA\nModest Nature\n- Make It Rain"}
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
                Imports full sets — nickname, item, ability, nature, level, EVs, IVs, and moves.
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
                  {s.members.slice(0, 6).map((m, idx) => {
                    const sp = BY_ID.get(m.speciesId);
                    return sp ? (
                      <img
                        key={`${m.speciesId}-${idx}`}
                        src={sp.sprites.regular}
                        alt={sp.name}
                        title={m.nickname?.trim() || sp.name}
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
                  onClick={() => setTeam(s.members.map((m) => ({ ...m })))}
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
