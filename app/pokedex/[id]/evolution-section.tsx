"use client";

import Link from "next/link";

/** One node of an evolution chain, as baked by scripts/fetch-evolutions.mjs. */
export interface EvoNode {
  id: number | null;
  name: string;
  sprite: string | null;
  /** Short label for how this species evolves from its parent, e.g. "Lv. 16". */
  method: string | null;
  evolvesTo: EvoNode[];
}

function EvoArrow({ method }: { method: string | null }) {
  return (
    <div className="flex w-14 shrink-0 flex-col items-center gap-0.5 sm:w-16">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="text-slate-400 dark:text-slate-500"
      >
        <path
          d="M3 10h12m0 0l-4-4m4 4l-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {method && (
        <span className="text-center text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-400">
          {method}
        </span>
      )}
    </div>
  );
}

function EvoCard({ node, currentId }: { node: EvoNode; currentId: number }) {
  const isCurrent = node.id === currentId;
  const className = `flex w-20 shrink-0 flex-col items-center rounded-xl p-2 transition sm:w-24 ${
    isCurrent
      ? "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-950"
      : "hover:bg-slate-100 dark:hover:bg-slate-800"
  }`;
  const inner = (
    <>
      {node.sprite ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={node.sprite}
          alt={node.name}
          loading="lazy"
          className="h-16 w-16 object-contain sm:h-20 sm:w-20"
        />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center text-xs text-slate-400 sm:h-20 sm:w-20">
          ?
        </span>
      )}
      <span className="mt-1 w-full truncate text-center text-xs font-medium text-slate-700 dark:text-slate-300">
        {node.name}
      </span>
    </>
  );
  if (node.id == null) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <Link
      href={`/pokedex/${node.id}`}
      className={className}
      aria-label={`View ${node.name}`}
      aria-current={isCurrent ? "true" : undefined}
    >
      {inner}
    </Link>
  );
}

function EvoNodeView({ node, currentId }: { node: EvoNode; currentId: number }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <EvoCard node={node} currentId={currentId} />
      {node.evolvesTo.length > 0 && (
        <div className="flex flex-col justify-center gap-2">
          {node.evolvesTo.map((child) => (
            <div
              key={child.id ?? child.name}
              className="flex items-center gap-1.5 sm:gap-2"
            >
              <EvoArrow method={child.method} />
              <EvoNodeView node={child} currentId={currentId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Evolution chain for the current species. Each sprite links to that
 * Pokémon's page; the current species is highlighted. Rendered only when
 * the species actually evolves (single-stage Pokémon skip this section).
 */
export function EvolutionSection({
  chain,
  currentId,
}: {
  chain: EvoNode;
  currentId: number;
}) {
  return (
    <section
      aria-label="Evolutions"
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
    >
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        Evolutions
      </h2>
      <div className="mt-3 overflow-x-auto pb-1">
        <EvoNodeView node={chain} currentId={currentId} />
      </div>
    </section>
  );
}
