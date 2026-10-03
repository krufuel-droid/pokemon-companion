"use client";

import { useState } from "react";

interface Gift {
  code: string | null; // null = via internet / other method
  method: string;
  reward: string;
  expires: string;
  expired?: boolean;
}

const ZA_GIFTS: Gift[] = [
  { code: "PREPAR1NG", method: "Code", reward: "5 Max Revives, 10 Full Restores, 10 Ultra Balls", expires: "Mar 31, 2027" },
  { code: null, method: "Via Internet", reward: "Mewtwonite X + Mewtwonite Y, Exp. Candy XL, “Project M” side mission (catch Mewtwo) — complete the main campaign", expires: "No expiry announced" },
  { code: null, method: "Via Internet", reward: "Diancite, Exp. Candy XL, “Shine Bright like a Gemstone” side mission (catch Diancie) — complete the main campaign", expires: "No expiry announced" },
  { code: null, method: "Via Internet", reward: "Garchompite Z + “Special Distortion Detected” mission (catch Mega Garchomp Z) — complete a hyperspace adventure in the Mega Dimension DLC", expires: "Mar 31, 2027" },
  { code: null, method: "In person", reward: "Cherish Ball Audino — visit a Pokémon Center (Japan, Singapore, Taiwan) during your birthday month with ID + Switch", expires: "Jan 31, 2027" },
];

const SV_GIFTS: Gift[] = [
  { code: "STRACKSU1T", method: "Code", reward: "Tracksuit outfit — Scarlet exclusive", expires: "No expiry announced" },
  { code: "VTRACKSU1T", method: "Code", reward: "Tracksuit outfit — Violet exclusive", expires: "No expiry announced" },
  { code: "SB00KC0VER", method: "Code", reward: "Book Cover Rotom Phone case — Scarlet exclusive", expires: "No expiry announced" },
  { code: "VB00KC0VER", method: "Code", reward: "Book Cover Rotom Phone case — Violet exclusive", expires: "No expiry announced" },
  { code: "NE0R0T0MC0VER", method: "Code", reward: "Neo-Kitakami Rotom Phone case", expires: "No expiry announced" },
  { code: null, method: "Via Internet", reward: "Mythical Pecha Berry — unlocks the DLC epilogue (needs Hidden Treasure of Area Zero)", expires: "No expiry announced" },
];

function GiftCard({ gift }: { gift: Gift }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!gift.code) return;
    void navigator.clipboard.writeText(gift.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          {gift.code ? (
            <button
              onClick={copy}
              title="Tap to copy"
              className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-lg font-bold tracking-wider text-slate-800 hover:bg-emerald-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-emerald-900"
            >
              {gift.code} {copied ? "✓" : "⧉"}
            </button>
          ) : (
            <span className="rounded-lg bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {gift.method}
            </span>
          )}
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{gift.reward}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {gift.code && <span className="mr-2 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">Code</span>}
        Expires: <span className="font-semibold">{gift.expires}</span>
      </p>
    </div>
  );
}

export default function MysteryGiftPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Mystery Gift Tracker</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Active distributions and codes — free stuff, no grinding required. Tap a code to copy it.
      </p>
      <p className="mt-1 text-xs text-slate-400">Last checked: October 3, 2026. Codes can expire without warning — claim soon!</p>

      <h2 className="mt-8 text-xl font-bold text-slate-700 dark:text-slate-200">Pokémon Legends: Z-A</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {ZA_GIFTS.map((g, i) => (
          <GiftCard key={i} gift={g} />
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <span className="font-bold">How to redeem in Z-A:</span> Link Play menu → Mystery Gift → “Get via Internet” or “Get with Code/Password”.
        Unlocks after Main Mission 3. Internet required, Nintendo Switch Online not required.
      </div>

      <h2 className="mt-8 text-xl font-bold text-slate-700 dark:text-slate-200">Pokémon Scarlet & Violet</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {SV_GIFTS.map((g, i) => (
          <GiftCard key={i} gift={g} />
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <span className="font-bold">How to redeem in S/V:</span> Press X → Poké Portal → Mystery Gift → “Get via Internet” or “Get with Code/Password”.
        Nintendo Switch Online not required.
      </div>
    </main>
  );
}
