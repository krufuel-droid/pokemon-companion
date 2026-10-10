/**
 * GET /api/teams/[code] — fetch a shared team by its short share code.
 *
 * Built for Caleb's Aura Corner battle coach: the team builder mints a
 * 6-character code per shared team (see supabase/migration-shared-teams.sql),
 * and Aura Corner fetches the full team as JSON by code. No auth needed —
 * codes are shareable by design.
 *
 * Response (200):
 *   { code, name, pokemon: [{ species, level, nature, evs, item, ability,
 *     moves }] }
 * Unknown code → 404 { error }.
 */

import { getAllSpecies } from "@/lib/pokedex";
import { getRegionalForms } from "@/lib/data/forms";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Species name lookup including regional-form variants (same synthetic-ID scheme as the team builder). */
const speciesById = (() => {
  const map = new Map<number, string>();
  for (const s of getAllSpecies()) map.set(s.id, s.name);
  getRegionalForms().forEach((f, i) => {
    map.set(f.speciesId * 100000 + i, f.formName);
  });
  return map;
})();

const EV_LABELS: Record<string, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

/** "32 Atk / 4 SpD / 32 Spe" — only non-zero stats, in display order. */
function formatEvs(evs: Record<string, number> | undefined): string | undefined {
  if (!evs) return undefined;
  const parts: string[] = [];
  for (const key of ["hp", "atk", "def", "spa", "spd", "spe"] as const) {
    const v = evs[key];
    if (typeof v === "number" && v > 0) parts.push(`${v} ${EV_LABELS[key]}`);
  }
  return parts.length > 0 ? parts.join(" / ") : undefined;
}

interface SharedMember {
  speciesId: number;
  nickname?: string;
  item?: string;
  ability?: string;
  nature?: string;
  level?: number;
  evs?: Record<string, number>;
  moves?: string[];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();

  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Team sharing is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shared_teams")
    .select("code, name, team")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    return Response.json({ error: "Team not found." }, { status: 404 });
  }

  const members = (Array.isArray(data.team) ? data.team : []) as SharedMember[];
  const pokemon = members.map((m) => {
    const species = speciesById.get(m.speciesId) ?? `Unknown (#${m.speciesId})`;
    const out: Record<string, unknown> = {
      species,
      level: typeof m.level === "number" ? m.level : 50,
    };
    if (m.nickname?.trim()) out.nickname = m.nickname.trim();
    if (m.nature?.trim()) out.nature = m.nature.trim();
    const evs = formatEvs(m.evs);
    if (evs) out.evs = evs;
    if (m.item?.trim()) out.item = m.item.trim();
    if (m.ability?.trim()) out.ability = m.ability.trim();
    const moves = (m.moves ?? []).map((x) => x.trim()).filter(Boolean).slice(0, 4);
    if (moves.length > 0) out.moves = moves;
    return out;
  });

  return Response.json({
    code: data.code,
    name: data.name,
    pokemon,
  });
}
