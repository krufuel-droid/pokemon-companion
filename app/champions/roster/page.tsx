import type { Metadata } from "next";
import Link from "next/link";
import { getSpeciesCard } from "@/lib/data/champions";
import regmcSnapshot from "@/data/pikalytics/gen9championsvgc2026regmc.json";
import ouSnapshot from "@/data/pikalytics/gen9championsou.json";
import { RosterSearch } from "./search";

export const metadata: Metadata = {
  title: "Champions Roster — Poké Companion",
  description:
    "Every Pokémon in the current Pokémon Champions formats, by usage — for checking names and knowing what the moveset data covers.",
};

interface SnapshotEntry {
  name: string;
  usage: number | null;
  winRate: number | null;
  record: string | null;
}

interface Snapshot {
  format: string;
  formatLabel: string;
  source: { label: string; url: string; license: string };
  dataDate: string | null;
  fetchedAt: string;
  roster: string[];
  pokemon: Record<string, SnapshotEntry>;
}

const FORMATS: Record<string, { snapshot: Snapshot; tab: string }> = {
  regmc: { snapshot: regmcSnapshot as unknown as Snapshot, tab: "VGC · Reg M-C" },
  ou: { snapshot: ouSnapshot as unknown as Snapshot, tab: "OU · Singles" },
};

/** Pikalytics "Salamence-Mega" → base "Salamence" for Pokédex linking. */
function baseName(pikalyticsName: string): string {
  return pikalyticsName
    .replace(/-Eternal-Mega$/i, "")
    .replace(/-Mega(-[XYZ])?$/i, "")
    .replace(/-(Hisui|Alola|Galar|Paldea)$/i, "")
    .replace(/-F$/i, "");
}

function UsageBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-white/40">—</span>;
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full bg-teal-300"
          style={{ width: `${Math.min(100, (pct / 40) * 100)}%` }}
        />
      </span>
      <span className="tabular-nums">{pct.toFixed(2)}%</span>
    </span>
  );
}

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string }>;
}) {
  const params = await searchParams;
  const key = params.format === "ou" ? "ou" : "regmc";
  const { snapshot, tab } = FORMATS[key];
  const entries = snapshot.roster
    .map((name) => snapshot.pokemon[name])
    .filter(Boolean) as SnapshotEntry[];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-200/70">
        Champions Hub
      </p>
      <h1 className="mt-1 text-3xl font-bold text-white">Champions Roster</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/60">
        Every Pokémon in the current {snapshot.formatLabel}, ordered by usage.
        This is the full roster the moveset API covers — handy for checking
        exact names before querying it.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-lg border border-white/15 text-sm">
          {(Object.keys(FORMATS) as Array<keyof typeof FORMATS>).map((k) => (
            <Link
              key={k}
              href={`/champions/roster?format=${k}`}
              className={`px-4 py-2 font-medium transition-colors ${
                k === key
                  ? "bg-teal-300/20 text-teal-100"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {FORMATS[k].tab}
            </Link>
          ))}
        </div>
        <RosterSearch />
      </div>

      <p className="mt-4 text-xs text-white/40">
        {entries.length} Pokémon · Usage data:{" "}
        <a
          href={snapshot.source.url}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-white/30 underline-offset-2 hover:text-white/70"
        >
          {snapshot.source.label}
        </a>{" "}
        ({snapshot.source.license}) · snapshot {snapshot.dataDate ?? "—"},
        refreshed {new Date(snapshot.fetchedAt).toLocaleDateString()}
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-left text-xs uppercase tracking-wider text-white/50">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Pokémon</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Win rate</th>
              <th className="px-4 py-3 font-medium text-right">Moveset</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const card = getSpeciesCard(baseName(entry.name));
              const showBase =
                baseName(entry.name).toLowerCase() !==
                entry.name.toLowerCase();
              return (
                <tr
                  key={entry.name}
                  data-roster-name={`${entry.name} ${baseName(entry.name)}`}
                  className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-2.5 tabular-nums text-white/40">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-3">
                      {card ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.sprite}
                          alt=""
                          width={36}
                          height={36}
                          className="h-9 w-9 object-contain"
                          loading="lazy"
                        />
                      ) : null}
                      <span>
                        {card ? (
                          <Link
                            href={`/pokedex/${card.id}`}
                            className="font-semibold text-white hover:text-teal-200 hover:underline"
                          >
                            {entry.name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-white">
                            {entry.name}
                          </span>
                        )}
                        {showBase && (
                          <span className="block text-xs text-white/40">
                            base: {baseName(entry.name)}
                          </span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-white/80">
                    <UsageBar pct={entry.usage} />
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-white/60">
                    {entry.winRate !== null
                      ? `${entry.winRate.toFixed(1)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <a
                      href={`/api/moveset?species=${encodeURIComponent(entry.name)}&format=${key}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-teal-200/80 hover:text-teal-100 hover:underline"
                    >
                      JSON ↗
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
