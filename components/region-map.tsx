import { GALAR_LOCATIONS } from "@/lib/data/region-maps";

interface RegionMapProps {
  region: string;
  /** Location key to highlight with a pin (e.g. "giants-cap"). */
  highlight?: string | null;
  /** All location keys to show as dots (defaults to labeled majors). */
  showAll?: boolean;
}

/**
 * Stylized hand-drawn region map with encounter pins.
 * Currently Galar only — more regions are added one by one.
 */
export function RegionMap({ region, highlight, showAll }: RegionMapProps) {
  if (region !== "galar") {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        This region&apos;s map is still being drawn — check back soon.
      </p>
    );
  }

  const locations = GALAR_LOCATIONS;
  const keys = Object.keys(locations);
  const highlightLoc = highlight ? locations[highlight] : undefined;

  return (
    <svg
      viewBox="0 0 200 205"
      role="img"
      aria-label="Stylized map of the Galar region"
      className="h-auto w-full"
    >
      {/* ocean */}
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#1e3a5f" />
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#274b73" opacity="0.6" />

      {/* mainland Galar — stylized inverted-UK shape */}
      <path
        d="M 70,148
           C 62,140 58,132 55,122
           C 52,112 46,102 45,92
           C 44,82 50,74 56,66
           C 62,58 72,52 82,46
           C 92,40 98,32 104,28
           C 110,24 118,30 126,36
           C 134,42 142,50 146,60
           C 150,70 142,78 134,84
           C 128,89 126,96 122,104
           C 118,112 116,120 108,128
           C 100,136 88,142 78,146
           Z"
        fill="#3d7a44"
        stroke="#2d5c33"
        strokeWidth="1.5"
      />
      {/* wild area tint */}
      <ellipse cx="103" cy="110" rx="22" ry="20" fill="#4c8a52" opacity="0.7" />

      {/* Isle of Armor */}
      <path
        d="M 172,92
           C 178,88 186,90 190,96
           C 194,102 192,112 188,120
           C 184,128 176,132 170,128
           C 164,124 164,114 166,106
           C 167,100 168,94 172,92 Z"
        fill="#3d7a44"
        stroke="#2d5c33"
        strokeWidth="1.5"
      />

      {/* Crown Tundra */}
      <path
        d="M 88,162
           C 94,158 104,158 112,160
           C 122,162 130,168 130,176
           C 130,184 122,190 112,192
           C 102,194 92,192 88,186
           C 84,180 84,168 88,162 Z"
        fill="#7a9ab0"
        stroke="#5c7a90"
        strokeWidth="1.5"
      />
      {/* snow tint */}
      <ellipse cx="108" cy="176" rx="14" ry="10" fill="#a8c4d4" opacity="0.6" />

      {/* region labels */}
      <text x="180" y="86" textAnchor="middle" fontSize="5" fill="#cfe3d0" fontStyle="italic">
        Isle of Armor
      </text>
      <text x="108" y="200" textAnchor="middle" fontSize="5" fill="#dfe9f0" fontStyle="italic">
        Crown Tundra
      </text>

      {/* location dots */}
      {keys.map((key) => {
        const loc = locations[key];
        const isHighlight = key === highlight;
        if (isHighlight) return null;
        if (!showAll && !loc.label) return null;
        const [x, y] = loc.coords;
        return (
          <g key={key}>
            <circle
              cx={x}
              cy={y}
              r={loc.label ? 2.2 : 1.2}
              fill={loc.label ? "#fff" : "#cfe3d0"}
              stroke="#2d5c33"
              strokeWidth="0.8"
              opacity={loc.label ? 1 : 0.7}
            />
            {loc.label && (
              <text
                x={x + 3.5}
                y={y + 1.5}
                fontSize="4.5"
                fill="#fff"
                fontWeight="600"
              >
                {loc.label}
              </text>
            )}
          </g>
        );
      })}

      {/* highlighted pin */}
      {highlightLoc && (
        <g>
          <circle cx={highlightLoc.coords[0]} cy={highlightLoc.coords[1]} r="7" fill="#ef4444" opacity="0.25">
            <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
          </circle>
          <path
            d={`M ${highlightLoc.coords[0]},${highlightLoc.coords[1] - 9}
                C ${highlightLoc.coords[0] - 4},${highlightLoc.coords[1] - 9} ${highlightLoc.coords[0] - 5},${highlightLoc.coords[1] - 3} ${highlightLoc.coords[0]},${highlightLoc.coords[1]}
                C ${highlightLoc.coords[0] + 5},${highlightLoc.coords[1] - 3} ${highlightLoc.coords[0] + 4},${highlightLoc.coords[1] - 9} ${highlightLoc.coords[0]},${highlightLoc.coords[1] - 9} Z`}
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth="0.8"
          />
          <circle cx={highlightLoc.coords[0]} cy={highlightLoc.coords[1] - 6} r="1.8" fill="#fff" />
        </g>
      )}
    </svg>
  );
}
