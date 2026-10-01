import type { BaseStat } from "@/lib/pokedex";

const LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 92;

function point(index: number, fraction: number): [number, number] {
  const angle = (Math.PI / 180) * (-90 + index * 60);
  const r = RADIUS * fraction;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

function polygonPath(fraction: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const [x, y] = point(i, fraction);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

export function StatsRadar({ stats }: { stats: BaseStat[] }) {
  if (!stats || stats.length !== 6) return null;

  const maxStat = Math.max(...stats.map((s) => s.value), 1);
  const scale = Math.max(100, Math.ceil(maxStat / 50) * 50);
  const total = stats.reduce((sum, s) => sum + s.value, 0);

  const dataPoints = stats.map((s, i) => {
    const [x, y] = point(i, s.value / scale);
    return { x, y, ...s };
  });

  return (
    <section
      aria-label="Base stats"
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
    >
      <h2 className="text-lg font-bold">Base stats</h2>
      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`Radar chart of base stats, total ${total}`}
          className="h-60 w-60 shrink-0"
        >
          {/* grid rings */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <path
              key={f}
              d={polygonPath(f)}
              fill="none"
              className="stroke-slate-200 dark:stroke-slate-700"
              strokeWidth="1"
            />
          ))}
          {/* axes */}
          {stats.map((s, i) => {
            const [x, y] = point(i, 1);
            const [lx, ly] = point(i, 1.22);
            return (
              <g key={s.key}>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={x}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="1"
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-500 dark:fill-slate-400"
                  fontSize="11"
                  fontWeight="600"
                >
                  {LABELS[s.key] ?? s.key}
                </text>
              </g>
            );
          })}
          {/* data polygon */}
          <polygon
            points={dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
            fill="#10b981"
            fillOpacity="0.25"
            stroke="#059669"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {dataPoints.map((p) => (
            <g key={p.key}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#059669" />
              <text
                x={p.x}
                y={p.y - 9}
                textAnchor="middle"
                className="fill-slate-800 dark:fill-slate-100"
                fontSize="11"
                fontWeight="700"
              >
                {p.value}
              </text>
            </g>
          ))}
        </svg>

        {/* stat list */}
        <dl className="w-full min-w-0 flex-1 space-y-2">
          {stats.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <dt className="w-16 shrink-0 text-sm font-medium text-slate-500 dark:text-slate-400">
                {LABELS[s.key] ?? s.key}
              </dt>
              <dd className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className="h-2 min-w-0 rounded-full bg-slate-100 dark:bg-slate-800"
                  style={{ flexGrow: 1 }}
                >
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, (s.value / scale) * 100)}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-bold text-slate-800 dark:text-slate-100">
                  {s.value}
                </span>
              </dd>
            </div>
          ))}
          <div className="flex items-center gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
            <dt className="w-16 shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Total
            </dt>
            <dd className="text-sm font-bold text-slate-900 dark:text-slate-100">{total}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
