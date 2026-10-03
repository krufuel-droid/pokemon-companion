/** Community Nuzlocke variants, shown as a badge on runs. */
export const NUZLOCKE_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "soul-link", label: "Soul Link" },
  { value: "wedlocke", label: "Wedlocke" },
  { value: "egglocke", label: "Egglocke" },
  { value: "randomizer", label: "Randomizer" },
  { value: "monotype", label: "Monotype" },
  { value: "sleeplocke", label: "Sleeplocke" },
  { value: "other", label: "Other" },
] as const;

export function runTypeLabel(value: string | null | undefined): string {
  const found = NUZLOCKE_TYPES.find((t) => t.value === value);
  return found ? found.label : "Standard";
}

export default function RunTypeBadge({ type }: { type: string | null | undefined }) {
  return (
    <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
      {runTypeLabel(type)}
    </span>
  );
}
