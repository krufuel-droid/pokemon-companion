interface Counter {
  pokemon: string;
  tera: string;
  ability: string;
  item: string;
  nature: string;
  evs: string;
  moves: string[];
  strategy: string;
}

interface RaidEvent {
  name: string;
  teraType: string;
  dates: string;
  status: "live" | "upcoming";
  bossMoves: string;
  counters: Counter[];
}

const EVENTS: RaidEvent[] = [
  {
    name: "Tyranitar the Unrivaled",
    teraType: "Ghost",
    dates: "Oct 2 – Oct 8, 2026",
    status: "live",
    bossMoves: "Stone Edge, Crunch, Shadow Claw, Earthquake — plus Focus Energy (crit boosts) and Dragon Dance. Bring Intimidate allies (Staraptor with Feather Dance is ideal).",
    counters: [
      {
        pokemon: "Krookodile",
        tera: "Dark",
        ability: "Anger Point (HA)",
        item: "Shell Bell",
        nature: "Adamant",
        evs: "4 HP / 252 Atk / 252 Def",
        moves: ["Bulk Up", "Breaking Swipe", "Power Trip", "Taunt"],
        strategy: "Breaking Swipe to charge Tera and lower its Attack. Taunt before it Dragon Dances. When it crits you, Anger Point maxes your Attack — then sweep with Tera-boosted Power Trip.",
      },
      {
        pokemon: "Primeape",
        tera: "Ghost",
        ability: "Anger Point",
        item: "Shell Bell",
        nature: "Adamant",
        evs: "252 HP / 4 Atk / 252 Def",
        moves: ["Taunt", "Rage Fist"],
        strategy: "Simple solo build: Taunt to block Dragon Dance, then Rage Fist — it grows stronger every time you're hit. Anger Point turns its crits into your win condition.",
      },
      {
        pokemon: "Crawdaunt",
        tera: "Dark",
        ability: "Shell Armor",
        item: "Shell Bell",
        nature: "Adamant",
        evs: "252 HP / 252 Atk / 4 Def",
        moves: ["Swords Dance", "Iron Defense", "Crunch", "Protect"],
        strategy: "Shell Armor ignores all its boosted crits. Set up with Iron Defense + Swords Dance, spam Crunch. Protect on the turn it nullifies your ability.",
      },
    ],
  },
  {
    name: "Salamence the Unrivaled",
    teraType: "???",
    dates: "Oct 9 – Oct 15, 2026",
    status: "upcoming",
    bossMoves: "Details TBA — Salamence is Dragon/Flying, 4× weak to Ice. Expect Dragon Dance and heavy physical hits.",
    counters: [
      {
        pokemon: "Baxcalibur",
        tera: "Ice",
        ability: "Thermal Exchange",
        item: "Shell Bell",
        nature: "Adamant",
        evs: "252 HP / 252 Atk / 4 Def",
        moves: ["Swords Dance", "Icicle Crash", "Ice Shard", "Protect"],
        strategy: "Ice hits Dragon/Flying for 4× damage. Set up Swords Dance behind Protect, then sweep. Thermal Exchange punishes Fire coverage.",
      },
      {
        pokemon: "Cetitan",
        tera: "Ice",
        ability: "Thick Fat",
        item: "Shell Bell",
        nature: "Adamant",
        evs: "252 HP / 252 Atk / 4 Def",
        moves: ["Belly Drum", "Ice Spinner", "Play Rough", "Protect"],
        strategy: "Classic Belly Drum sweeper — max Attack in one turn, then Ice Spinner for massive damage. Thick Fat softens Fire/Ice hits.",
      },
    ],
  },
];

const GENERAL_TIPS = [
  "7-star raids are Lv. 100 with the Mightiest Mark — bring Lv. 100 Pokémon with maxed IVs (Hyper Trained) and a proper EV spread.",
  "Shell Bell is the default raid item: it heals you as you deal damage, which matters more than raw power in long raids.",
  "Cheer strategically: 'Go all out!' after setting up, 'Heal up!' when the team is low — cheers don't cost a turn.",
  "Terastallize only after the boss nullifies your stat changes (it wipes your Tera charge timing otherwise) — usually best mid-fight.",
  "For solo runs, NPC allies with Intimidate (Arcanine, Staraptor, Tauros) quietly carry by lowering the boss's Attack all fight.",
  "You can only catch the 7-star boss once per event, but you can re-run it for Herba Mystica and other drops.",
];

export default function RaidCounterPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Tera Raid Counters</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Best builds for the current 7-star events — what to bring and how to play it.
      </p>
      <p className="mt-1 text-xs text-slate-400">Last checked: October 3, 2026.</p>

      {EVENTS.map((event) => (
        <section key={event.name} className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">{event.name}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${event.status === "live" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"}`}>
              {event.status === "live" ? "● LIVE NOW" : "UPCOMING"}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{event.dates} · Tera: {event.teraType}</span>
          </div>
          <p className="mt-2 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <span className="font-bold">Boss behavior:</span> {event.bossMoves}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {event.counters.map((c) => (
              <div key={c.pokemon} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{c.pokemon}</h3>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-400">Tera</dt><dd className="text-slate-600 dark:text-slate-300">{c.tera}</dd></div>
                  <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-400">Ability</dt><dd className="text-slate-600 dark:text-slate-300">{c.ability}</dd></div>
                  <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-400">Item</dt><dd className="text-slate-600 dark:text-slate-300">{c.item}</dd></div>
                  <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-400">Nature</dt><dd className="text-slate-600 dark:text-slate-300">{c.nature}</dd></div>
                  <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-400">EVs</dt><dd className="font-mono text-xs text-slate-600 dark:text-slate-300">{c.evs}</dd></div>
                  <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-400">Moves</dt><dd className="text-slate-600 dark:text-slate-300">{c.moves.join(" · ")}</dd></div>
                </dl>
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  {c.strategy}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <h2 className="mt-10 text-xl font-bold text-slate-700 dark:text-slate-200">7-star raid fundamentals</h2>
      <ul className="mt-3 space-y-2">
        {GENERAL_TIPS.map((tip, i) => (
          <li key={i} className="rounded-2xl bg-white px-5 py-3 text-sm leading-6 text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
            {tip}
          </li>
        ))}
      </ul>
    </main>
  );
}
