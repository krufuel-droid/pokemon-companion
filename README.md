# Pokémon Companion

**Pokémon Companion is an unofficial fan project, not affiliated with Nintendo / Creatures Inc. / GAME FREAK inc.**

Pokémon Companion is a community hub for Pokémon fans: look up any species in a complete Pokédex, crunch battle numbers with built-in calculators, and (as future phases roll out) share posts, befriend other trainers, and track your Nuzlocke runs and shiny hunts — all in one place.

## Phase 1 features

- **Pokédex** — all 1,025 species with search, shiny sprites, and per-game English Pokédex entries
- **Damage calculator** — type matchups, STAB, and stat math for planning battles
- **Catch-rate calculator** — odds of catching a species given ball, HP, and status
- **Breeding helper** — egg groups, nature inheritance, and IV passing at a glance

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Data pipeline

Pokédex data and sprites are sourced from PokéAPI. To refresh the local data:

```bash
node scripts/fetch-pokedex.mjs   # re-fetches species data into data/
```

## Deployment

1. Push the repo to GitHub
2. In Vercel, click **Import Project** and select the repo
3. Set the environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy
5. In the Supabase Dashboard, open **SQL Editor**, paste in `supabase/schema.sql`, and run it to create the database tables

## Accounts setup (Phase 2)

Beyond running `supabase/schema.sql`, two Supabase dashboard steps matter:

1. **API keys → Vercel.** In Supabase go to **Project Settings → API** and copy the
   project URL plus the `anon` `public` key into Vercel as the environment variables
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then redeploy.
2. **Site URL for emails.** In Supabase go to **Authentication → URL Configuration** and set
   **Site URL** to the live Vercel URL (e.g. `https://pokemon-companion.vercel.app`), so
   signup confirmation links point at the real site instead of localhost.

Optional, both safe to skip:

- **Confirm email** (Authentication → Providers → Email) is on by default: new users must
  click the email link before signing in, and the app shows a "check your inbox" screen.
  Turn it off for instant signup; leaving it on is safer against spam with open signup.
- The bottom of `supabase/schema.sql` has a commented snippet that auto-creates a profile
  row at signup. The app creates the row on the user's first profile visit anyway, so this
  is only needed if you want the row to exist immediately.

## Phase plan

- **Phase 1** — Pokédex UI + battle tools (current)
- **Phase 2** — Supabase auth + trainer profiles
- **Phase 3** — Posts, reactions, friend requests, DMs + moderation tools
- **Phase 4** — Nuzlocke tracker, shiny-hunt tracker, collections, memorials, news

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Vercel

## Credits

Pokédex data and sprites via [PokéAPI](https://pokeapi.co). Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc.
