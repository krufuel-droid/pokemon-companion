import { GALAR_LOCATIONS, PALDEA_LOCATIONS, KANTO_LOCATIONS, JOHTO_LOCATIONS, HOENN_LOCATIONS, SINNOH_LOCATIONS, UNOVA_LOCATIONS, KALOS_LOCATIONS, ALOLA_LOCATIONS } from "@/lib/data/region-maps";

interface RegionMapProps {
  region: string;
  /** Location key to highlight with a pin (e.g. "giants-cap"). */
  highlight?: string | null;
  /** All location keys to show as dots (defaults to labeled majors). */
  showAll?: boolean;
}

const REGION_LABELS: Record<string, string> = {
  galar: "Galar",
  paldea: "Paldea",
  kanto: "Kanto",
  johto: "Johto",
  hoenn: "Hoenn",
  sinnoh: "Sinnoh",
  unova: "Unova",
  kalos: "Kalos",
  alola: "Alola",
};

function GalarTerrain() {
  return (
    <>
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
    </>
  );
}

function PaldeaTerrain() {
  return (
    <>
      {/* ocean */}
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#1e3a5f" />
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#274b73" opacity="0.6" />

      {/* mainland Paldea — stylized Iberian-peninsula shape */}
      <path
        d="M 60,172
           C 48,164 40,152 38,138
           C 36,124 32,112 36,100
           C 40,88 48,78 56,68
           C 64,58 76,50 90,44
           C 104,38 118,32 130,28
           C 142,24 154,30 162,40
           C 170,50 172,62 168,74
           C 164,86 168,98 164,110
           C 160,122 150,132 140,142
           C 130,152 118,160 106,166
           C 94,172 76,178 60,172
           Z"
        fill="#4a7c3f"
        stroke="#356030"
        strokeWidth="1.5"
      />
      {/* Area Zero crater */}
      <ellipse cx="100" cy="131" rx="13" ry="11" fill="#5c4a3a" opacity="0.85" />
      <ellipse cx="100" cy="131" rx="8" ry="6.5" fill="#3a2f26" opacity="0.9" />
      {/* Asado Desert tint */}
      <ellipse cx="60" cy="115" rx="14" ry="10" fill="#c2a25e" opacity="0.55" />
      {/* Glaseado Mountain snowcap */}
      <ellipse cx="125" cy="28" rx="16" ry="10" fill="#dfe9f0" opacity="0.75" />
      {/* Casseroya Lake */}
      <ellipse cx="60" cy="70" rx="9" ry="7" fill="#3b6ea5" opacity="0.9" />

      {/* Kitakami highlands (northeast) */}
      <path
        d="M 170,22
           C 176,20 184,22 188,28
           C 192,34 190,42 186,48
           C 182,54 174,54 170,48
           C 166,42 166,28 170,22 Z"
        fill="#4a7c3f"
        stroke="#356030"
        strokeWidth="1.2"
      />
      <text x="179" y="18" textAnchor="middle" fontSize="4.5" fill="#cfe3d0" fontStyle="italic">
        Kitakami
      </text>

      {/* Blueberry Academy Terarium (southeast inset) */}
      <rect x="160" y="156" width="32" height="28" rx="4" fill="#2c4a63" stroke="#1e3a5f" strokeWidth="1" />
      <text x="176" y="162" textAnchor="middle" fontSize="4" fill="#cfe3d0" fontStyle="italic">
        Terarium
      </text>
    </>
  );
}

function KantoTerrain() {
  return (
    <>
      {/* ocean */}
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#1e3a5f" />
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#274b73" opacity="0.6" />

      {/* mainland Kanto — stylized rounded region */}
      <path
        d="M 60,162
           C 48,158 40,148 38,136
           C 36,124 40,114 48,106
           C 56,98 68,94 82,94
           C 96,94 108,98 120,102
           C 132,106 142,114 144,126
           C 146,138 140,148 130,154
           C 120,160 108,162 96,162
           C 84,162 70,164 60,162
           Z"
        fill="#4a7c3f"
        stroke="#356030"
        strokeWidth="1.5"
      />
      {/* Viridian Forest tint */}
      <ellipse cx="60" cy="122" rx="10" ry="8" fill="#2d5c33" opacity="0.6" />
      {/* Mt. Moon tint */}
      <ellipse cx="88" cy="112" rx="8" ry="6" fill="#8a8a8a" opacity="0.5" />

      {/* Cinnabar Island */}
      <ellipse cx="70" cy="179" rx="7" ry="5" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
      {/* Seafoam Islands */}
      <ellipse cx="114" cy="172" rx="6" ry="4" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />

      {/* Sevii Islands archipelago */}
      <g fill="#4a7c3f" stroke="#356030" strokeWidth="0.8">
        <ellipse cx="44" cy="194" rx="6" ry="4" />
        <ellipse cx="70" cy="194" rx="6" ry="4" />
        <ellipse cx="99" cy="194" rx="6" ry="4" />
        <ellipse cx="123" cy="194" rx="6" ry="4" />
        <ellipse cx="145" cy="194" rx="6" ry="4" />
        <ellipse cx="163" cy="194" rx="6" ry="4" />
        <ellipse cx="180" cy="194" rx="7" ry="5" />
      </g>
      <text x="110" y="203" textAnchor="middle" fontSize="4.5" fill="#cfe3d0" fontStyle="italic">
        Sevii Islands
      </text>
    </>
  );
}

function JohtoTerrain() {
  return (
    <>
      {/* ocean */}
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#1e3a5f" />
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#274b73" opacity="0.6" />

      {/* mainland Johto — stylized western region */}
      <path
        d="M 110,142
           C 100,144 92,142 86,138
           C 80,134 76,128 74,120
           C 72,112 68,106 60,102
           C 52,98 48,92 52,84
           C 56,76 64,70 74,66
           C 84,62 94,60 104,58
           C 114,56 124,52 132,48
           C 140,44 148,40 152,36
           C 156,32 158,38 156,46
           C 154,54 148,62 142,70
           C 136,78 130,86 124,94
           C 118,102 114,112 114,122
           C 114,132 112,138 110,142
           Z"
        fill="#4a7c3f"
        stroke="#356030"
        strokeWidth="1.5"
      />
      {/* Ilex Forest tint */}
      <ellipse cx="73" cy="124" rx="8" ry="6" fill="#2d5c33" opacity="0.6" />
      {/* Mt. Silver tint */}
      <ellipse cx="60" cy="60" rx="10" ry="8" fill="#8a8a8a" opacity="0.5" />

      {/* Cianwood island */}
      <ellipse cx="36" cy="111" rx="6" ry="5" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
      {/* Whirl Islands */}
      <g fill="#4a7c3f" stroke="#356030" strokeWidth="0.8">
        <ellipse cx="49" cy="124" rx="3" ry="2.5" />
        <ellipse cx="53" cy="128" rx="3" ry="2.5" />
      </g>
    </>
  );
}

function HoennTerrain() {
  return (
    <>
      {/* ocean */}
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#1e3a5f" />
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#274b73" opacity="0.6" />

      {/* mainland Hoenn — wide island ringed by sea */}
      <path
        d="M 100,172
           C 88,170 76,166 66,160
           C 56,154 50,144 52,134
           C 54,124 60,116 68,110
           C 76,104 84,100 92,96
           C 100,92 108,92 116,96
           C 124,100 132,104 140,110
           C 148,116 154,124 154,134
           C 154,144 148,152 140,158
           C 132,164 122,168 112,170
           C 108,171 104,172 100,172
           Z"
        fill="#4a7c3f"
        stroke="#356030"
        strokeWidth="1.5"
      />
      {/* desert tint (Route 111) */}
      <ellipse cx="100" cy="122" rx="12" ry="8" fill="#d4a24e" opacity="0.5" />
      {/* Mt. Chimney tint */}
      <ellipse cx="100" cy="110" rx="8" ry="6" fill="#8a4a3a" opacity="0.5" />
      {/* Petalburg Woods tint */}
      <ellipse cx="64" cy="150" rx="8" ry="6" fill="#2d5c33" opacity="0.6" />
      {/* Fortree tint */}
      <ellipse cx="130" cy="125" rx="10" ry="8" fill="#2d5c33" opacity="0.6" />

      {/* Dewford island */}
      <ellipse cx="50" cy="165" rx="6" ry="5" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
      {/* Mossdeep island */}
      <ellipse cx="170" cy="135" rx="7" ry="6" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
      {/* Sootopolis crater */}
      <ellipse cx="130" cy="170" rx="7" ry="6" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
      {/* Ever Grande island */}
      <ellipse cx="180" cy="150" rx="6" ry="8" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
      {/* Pacifidlog */}
      <ellipse cx="85" cy="178" rx="5" ry="4" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
      {/* Battle Frontier island */}
      <ellipse cx="190" cy="180" rx="7" ry="6" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
    </>
  );
}

function SinnohTerrain() {
  return (
    <>
      {/* ocean */}
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#1e3a5f" />
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#274b73" opacity="0.6" />

      {/* mainland Sinnoh — diamond shape */}
      <path
        d="M 100,24
           C 115,35 130,48 142,62
           C 154,76 162,92 160,108
           C 158,124 148,140 134,152
           C 120,164 106,170 92,164
           C 78,158 64,148 54,134
           C 44,120 38,104 42,88
           C 46,72 58,56 72,44
           C 82,36 92,28 100,24
           Z"
        fill="#4a7c3f"
        stroke="#356030"
        strokeWidth="1.5"
      />
      {/* Mt. Coronet tint (center spine) */}
      <path
        d="M 96,30 L 104,30 L 106,110 L 94,110 Z"
        fill="#8a8a8a"
        opacity="0.5"
      />
      {/* snowy north tint */}
      <ellipse cx="100" cy="38" rx="18" ry="12" fill="#e8e8e8" opacity="0.45" />
      {/* Eterna Forest tint */}
      <ellipse cx="65" cy="88" rx="10" ry="8" fill="#2d5c33" opacity="0.6" />
      {/* Great Marsh tint */}
      <ellipse cx="115" cy="127" rx="8" ry="5" fill="#3d6b4a" opacity="0.6" />

      {/* Iron Island */}
      <ellipse cx="30" cy="100" rx="5" ry="7" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
      {/* Fullmoon / Newmoon islands */}
      <ellipse cx="20" cy="110" rx="4" ry="3" fill="#4a7c3f" stroke="#356030" strokeWidth="0.8" />
      <ellipse cx="15" cy="115" rx="3" ry="2.5" fill="#4a7c3f" stroke="#356030" strokeWidth="0.8" />
      {/* Battle Zone island (northeast) */}
      <path
        d="M 168,60
           C 176,56 186,58 192,64
           C 198,70 198,80 194,88
           C 190,96 182,100 174,96
           C 166,92 162,82 164,72
           C 165,66 166,62 168,60
           Z"
        fill="#4a7c3f"
        stroke="#356030"
        strokeWidth="1"
      />
      {/* Stark Mountain tint */}
      <ellipse cx="190" cy="65" rx="5" ry="5" fill="#8a4a3a" opacity="0.5" />
    </>
  );
}

function UnovaTerrain() {
  return (
    <>
      {/* ocean */}
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#1e3a5f" />
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#274b73" opacity="0.6" />

      {/* mainland Unova — circular region */}
      <path
        d="M 100,52
           C 120,52 140,60 152,74
           C 164,88 170,104 168,120
           C 166,136 158,150 146,160
           C 134,170 120,176 106,176
           C 92,176 78,170 68,160
           C 58,150 52,136 52,120
           C 52,104 58,88 70,74
           C 80,62 90,52 100,52
           Z"
        fill="#4a7c3f"
        stroke="#356030"
        strokeWidth="1.5"
      />
      {/* desert tint (Route 4) */}
      <ellipse cx="100" cy="135" rx="12" ry="7" fill="#d4a24e" opacity="0.5" />
      {/* Pinwheel Forest tint */}
      <ellipse cx="85" cy="135" rx="8" ry="6" fill="#2d5c33" opacity="0.6" />
      {/* Twist Mountain tint */}
      <ellipse cx="50" cy="100" rx="8" ry="10" fill="#8a8a8a" opacity="0.5" />
      {/* Giant Chasm tint */}
      <ellipse cx="150" cy="80" rx="8" ry="6" fill="#5a6a7a" opacity="0.5" />

      {/* Liberty Garden island */}
      <ellipse cx="60" cy="180" rx="5" ry="4" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
      {/* Humilau peninsula */}
      <ellipse cx="175" cy="135" rx="6" ry="5" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
    </>
  );
}

function KalosTerrain() {
  return (
    <>
      {/* ocean */}
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#1e3a5f" />
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#274b73" opacity="0.6" />

      {/* mainland Kalos — star shape */}
      <path
        d="M 100,28
           L 112,60 L 140,72 L 128,100 L 150,118
           L 122,128 L 120,155 L 100,138 L 80,155
           L 78,128 L 50,118 L 72,100 L 60,72
           L 88,60 Z"
        fill="#4a7c3f"
        stroke="#356030"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* snowy north tint */}
      <ellipse cx="100" cy="45" rx="12" ry="10" fill="#e8e8e8" opacity="0.45" />
      {/* Lumiose Badlands tint */}
      <ellipse cx="95" cy="108" rx="10" ry="6" fill="#d4a24e" opacity="0.45" />
      {/* Santalune Forest tint */}
      <ellipse cx="82" cy="97" rx="7" ry="5" fill="#2d5c33" opacity="0.6" />
      {/* Winding Woods tint */}
      <ellipse cx="125" cy="95" rx="8" ry="6" fill="#2d5c33" opacity="0.6" />

      {/* Azure Bay islands */}
      <g fill="#4a7c3f" stroke="#356030" strokeWidth="0.8">
        <ellipse cx="75" cy="155" rx="5" ry="4" />
        <ellipse cx="70" cy="158" rx="4" ry="3" />
      </g>
      {/* Kiloude island */}
      <ellipse cx="140" cy="120" rx="6" ry="5" fill="#4a7c3f" stroke="#356030" strokeWidth="1" />
    </>
  );
}

function AlolaTerrain() {
  return (
    <>
      {/* ocean */}
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#1e3a5f" />
      <rect x="0" y="0" width="200" height="205" rx="12" fill="#274b73" opacity="0.6" />

      {/* four islands of Alola */}
      <g fill="#4a7c3f" stroke="#356030" strokeWidth="1.2">
        {/* Melemele (northwest) */}
        <path
          d="M 50,50
             C 60,48 70,52 74,60
             C 78,68 74,76 66,78
             C 58,80 48,76 44,68
             C 40,60 44,52 50,50 Z"
        />
        {/* Akala (northeast) */}
        <path
          d="M 120,52
             C 130,50 140,54 144,62
             C 148,70 144,80 136,86
             C 128,92 118,90 112,82
             C 106,74 110,62 116,56
             C 117,54 118,53 120,52 Z"
        />
        {/* Ula'ula (southeast) */}
        <path
          d="M 120,125
             C 130,123 140,127 144,135
             C 148,143 144,153 136,159
             C 128,165 118,163 112,155
             C 106,147 110,135 116,129
             C 117,127 118,126 120,125 Z"
        />
        {/* Poni (southwest) */}
        <path
          d="M 50,145
             C 60,143 70,147 74,155
             C 78,163 74,173 66,175
             C 58,177 48,173 44,165
             C 40,157 44,147 50,145 Z"
        />
      </g>
      {/* Lush Jungle tint */}
      <ellipse cx="140" cy="92" rx="7" ry="5" fill="#2d5c33" opacity="0.6" />
      {/* Wela Volcano tint */}
      <ellipse cx="130" cy="88" rx="6" ry="5" fill="#8a4a3a" opacity="0.5" />
      {/* Haina Desert tint */}
      <ellipse cx="140" cy="148" rx="7" ry="5" fill="#d4a24e" opacity="0.5" />

      {/* Aether Paradise (center) */}
      <ellipse cx="100" cy="110" rx="6" ry="5" fill="#7ab8c4" stroke="#4a8a96" strokeWidth="1" />
      <text x="100" y="121" textAnchor="middle" fontSize="4" fill="#cfe3d0" fontStyle="italic">
        Aether
      </text>
      {/* Mount Lanakila (north) */}
      <ellipse cx="100" cy="40" rx="8" ry="6" fill="#e8e8e8" stroke="#b8b8b8" strokeWidth="1" />
      {/* Exeggutor Island */}
      <ellipse cx="50" cy="165" rx="4" ry="3" fill="#4a7c3f" stroke="#356030" strokeWidth="0.8" />
    </>
  );
}

/**
 * Stylized hand-drawn region maps with encounter pins.
 * Regions are added one by one — Galar, Paldea, Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, and Alola so far.
 */
export function RegionMap({ region, highlight, showAll }: RegionMapProps) {
  const locations =
    region === "galar"
      ? GALAR_LOCATIONS
      : region === "paldea"
        ? PALDEA_LOCATIONS
        : region === "kanto"
          ? KANTO_LOCATIONS
          : region === "johto"
          ? JOHTO_LOCATIONS
          : region === "hoenn"
          ? HOENN_LOCATIONS
          : region === "sinnoh"
          ? SINNOH_LOCATIONS
          : region === "unova"
          ? UNOVA_LOCATIONS
          : region === "kalos"
          ? KALOS_LOCATIONS
          : region === "alola"
            ? ALOLA_LOCATIONS
            : null;

  if (!locations) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        This region&apos;s map is still being drawn — check back soon.
      </p>
    );
  }
  const keys = Object.keys(locations);
  const highlightLoc = highlight ? locations[highlight] : undefined;

  return (
    <svg
      viewBox="0 0 200 205"
      role="img"
      aria-label={`Stylized map of the ${REGION_LABELS[region] ?? region} region`}
      className="h-auto w-full"
    >
      {region === "galar" ? (
        <GalarTerrain />
      ) : region === "paldea" ? (
        <PaldeaTerrain />
      ) : (
        <KantoTerrain />
      )}

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
