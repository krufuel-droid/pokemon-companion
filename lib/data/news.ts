/**
 * Pokémon Companion news feed.
 *
 * Entries are shown newest-first on /news. To add an entry, append a new
 * object at the TOP of the NEWS array with:
 *   - date: ISO date string (YYYY-MM-DD)
 *   - title: short headline
 *   - body: 1–3 sentences (plain text; keep it factual)
 *   - source: { label, url } — link to the original announcement/report
 *   - tag: optional short label like "Champions", "Gen 10", "App"
 */

export interface NewsItem {
  date: string;
  title: string;
  body: string;
  source: { label: string; url: string };
  tag?: string;
}

export const NEWS: NewsItem[] = [
  {
    date: "2026-10-01",
    title: "Pokémon Companion launches community features",
    body: "The Community tab is live! Make posts, react with ❤️ 🔥 😮 👏, add friends by trainer name, and trade DMs with your friends. The Pokédex now shows all 1,025 species on one page too.",
    source: {
      label: "Pokémon Companion",
      url: "https://pokemon-companion-pi.vercel.app/community",
    },
    tag: "App",
  },
  {
    date: "2026-09-09",
    title: "Pokémon Champions: Regulation M-C brings new roster, Megas, and items",
    body: "Regulation M-C began September 9 and runs until December 2, 2026. The update adds 23 Pokémon including Rillaboom, Cinderace, Inteleon, Indeedee, and Baxcalibur, plus six new Mega Evolutions — Mega Absol Z, Mega Salamence, Mega Garchomp Z, Mega Lucario Z, Mega Golisopod, and Mega Baxcalibur — and new held items for Ranked Battles.",
    source: {
      label: "Lords of Gaming",
      url: "https://lordsofgaming.net/2026/09/pokemon-champions-regulation-m-c-update-adds-new-pokemon-mega-evolutions-and-items/",
    },
    tag: "Champions",
  },
  {
    date: "2026-09-09",
    title: "Mega Lucario Z, Mega Garchomp Z, and Mega Absol Z debut in Champions",
    body: "Three new Z-Mega Evolutions headline the latest Pokémon Champions season alongside newly legal competitive picks like Rillaboom. The season runs through December 2, 2026.",
    source: {
      label: "Univers-Simu",
      url: "https://en.univers-simu.com/News/pokemon-champions-mega-lucario-z-mega-evolutions-128097/",
    },
    tag: "Champions",
  },
  {
    date: "2026-02-27",
    title: "Pokémon Winds and Pokémon Waves announced for 2027",
    body: "The tenth generation of Pokémon was revealed during the 30th anniversary celebrations: Pokémon Winds and Pokémon Waves launch exclusively on Nintendo Switch 2 in 2027, set across a tropical archipelago of windswept islands and open ocean. The three starters are Browt (Grass), Pombon (Fire), and Gecqua (Water).",
    source: {
      label: "Geektown",
      url: "https://www.geektown.co.uk/2026/09/23/pokemon-winds-and-waves-is-coming-so-heres-how-to-catch-up-on-every-pokemon-first/",
    },
    tag: "Gen 10",
  },
  {
    date: "2026-08-16",
    title: "Pokémon: Wild Card movie announced for 2027",
    body: "The first Pokémon theatrical film in seven years was unveiled at the 2026 Pokémon World Championships in San Francisco. Pokémon: Wild Card is an original animated story centered on a trading card game player and a ghostly Mimikyu partner, with a worldwide theatrical release slated for 2027.",
    source: {
      label: "EpicFlix",
      url: "https://epicflix.com/pokemon-wild-card-sets-2027-worldwide-release-date-drops-first-teaser-trailer-starring-a-tcg-player",
    },
    tag: "Movies",
  },
];
