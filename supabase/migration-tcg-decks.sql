-- ============================================================================
-- Pokémon Companion — TCG Deck Builder migration
-- ----------------------------------------------------------------------------
-- WHAT THIS ADDS:
--   * tcg_decks — saved 60-card decks: id, user_id, name, format
--     ('Standard' | 'Expanded' | 'Unlimited'), is_public (default false),
--     created_at.
--   * tcg_deck_cards — cards inside a deck: deck_id, card_id, card_name,
--     image_url, supertype, quantity. One row per card per deck
--     (unique deck_id + card_id). The 4-copy rule (unlimited basic Energy)
--     is enforced in the app UI.
--   * Row Level Security:
--       - tcg_decks: owner has full access; anyone may read decks with
--         is_public = true (shareable deck links).
--       - tcg_deck_cards: owner has full access via deck ownership; anyone
--         may read cards of public decks.
--   * Seeds the 'deck-builder' achievement (TCG category). Guarded: no-op if
--     the achievements table doesn't exist yet.
--
-- HOW TO RUN THIS (for the app owner, no coding needed):
--   1. Open your Supabase project at https://supabase.com/dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this whole file, and click "Run"
--   4. Done. It is safe to run this file more than once — every statement is
--      guarded so re-running won't create duplicates or throw errors.
-- Requires: pgcrypto extension (standard on Supabase) for gen_random_uuid().
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. tcg_decks — saved decks
-- ----------------------------------------------------------------------------
create table if not exists tcg_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  format text not null default 'Standard'
    check (format in ('Standard', 'Expanded', 'Unlimited')),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table tcg_decks is
  'TCG Deck Builder: saved user decks. Public decks are viewable by anyone via share link.';

create index if not exists idx_tcg_decks_user on tcg_decks (user_id, created_at desc);

alter table tcg_decks enable row level security;

-- Owner full access.
drop policy if exists tcg_decks_owner_all on tcg_decks;
create policy tcg_decks_owner_all on tcg_decks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone may read public decks.
drop policy if exists tcg_decks_public_read on tcg_decks;
create policy tcg_decks_public_read on tcg_decks
  for select using (is_public = true);

-- ----------------------------------------------------------------------------
-- 2. tcg_deck_cards — cards inside a deck
-- ----------------------------------------------------------------------------
create table if not exists tcg_deck_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references tcg_decks(id) on delete cascade,
  card_id text not null,
  card_name text not null,
  image_url text,
  supertype text,
  subtypes text,
  legalities text,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 99),
  created_at timestamptz not null default now(),
  unique (deck_id, card_id)
);
comment on table tcg_deck_cards is
  'TCG Deck Builder: card entries within a deck (one row per card per deck).';

create index if not exists idx_tcg_deck_cards_deck on tcg_deck_cards (deck_id);

alter table tcg_deck_cards enable row level security;

-- Owner full access (via deck ownership).
drop policy if exists tcg_deck_cards_owner_all on tcg_deck_cards;
create policy tcg_deck_cards_owner_all on tcg_deck_cards
  for all using (
    exists (
      select 1 from tcg_decks d
      where d.id = tcg_deck_cards.deck_id
        and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from tcg_decks d
      where d.id = tcg_deck_cards.deck_id
        and d.user_id = auth.uid()
    )
  );

-- Anyone may read cards of public decks.
drop policy if exists tcg_deck_cards_public_read on tcg_deck_cards;
create policy tcg_deck_cards_public_read on tcg_deck_cards
  for select using (
    exists (
      select 1 from tcg_decks d
      where d.id = tcg_deck_cards.deck_id
        and d.is_public = true
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Seed the deck-builder achievement (guarded).
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.achievements') is not null then
    insert into achievements (id, name, description, icon, category) values
      ('deck-builder', 'Deck Architect', 'Build your first 60-card deck', '🃏', 'TCG')
    on conflict (id) do nothing;
  end if;
end $$;
