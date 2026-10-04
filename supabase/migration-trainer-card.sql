-- ============================================================================
-- Pokémon Companion — Trainer Card migration
-- ----------------------------------------------------------------------------
-- WHAT THIS ADDS:
--   * profiles.show_trainer_card (boolean, default true) — toggle that
--     controls whether the trainer's public trainer card
--     (/trainer/[username]) shows the card extras (favorites, shiny count,
--     TCG stats). The page itself stays visible like any public profile.
--   * trainer_card_favorites — up to 6 favorite Pokémon per user for the
--     trainer card: user_id, species_id, species_name, position (0-5,
--     unique per user).
--   * Row Level Security:
--       - trainer_card_favorites: owner full access; publicly readable
--         ONLY when the owner's profiles.show_trainer_card is true.
--       - shiny_hunts: visitors may count a trainer's COMPLETED hunts
--         (status = 'completed' only) when that trainer's card is public,
--         so the card can show a shiny count. All other access unchanged
--         (still owner-only).
--       - tcg_collection / tcg_master_set: when a trainer card is public,
--         visitors may also read that owner's collection entries
--         (list = 'collection' only — never the want list) and master-set
--         marks, so the card can show TCG totals. Write paths are
--         untouched (still owner-only). Coexists with the binder policies.
--   * Seeds the 'trainer-card' achievement (Community category). Guarded:
--     no-op if the achievements table doesn't exist yet.
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
-- 1. profiles.show_trainer_card — trainer card visibility toggle.
-- ----------------------------------------------------------------------------
alter table profiles add column if not exists show_trainer_card boolean not null default true;
comment on column profiles.show_trainer_card is
  'When true, the trainer''s public page (/trainer/[username]) shows the shareable trainer card extras: favorite Pokémon, shiny count, and TCG totals.';

-- ----------------------------------------------------------------------------
-- 2. trainer_card_favorites — up to 6 favorite Pokémon per user
-- ----------------------------------------------------------------------------
create table if not exists trainer_card_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id integer not null,
  species_name text not null,
  position integer not null check (position >= 0 and position < 6),
  created_at timestamptz not null default now(),
  unique (user_id, position),
  unique (user_id, species_id)
);
comment on table trainer_card_favorites is
  'Trainer Card: up to 6 favorite Pokémon per user, shown on their public trainer card.';

create index if not exists idx_trainer_card_favorites_user on trainer_card_favorites (user_id, position);

alter table trainer_card_favorites enable row level security;

-- Owner full access.
drop policy if exists trainer_card_favorites_owner_all on trainer_card_favorites;
create policy trainer_card_favorites_owner_all on trainer_card_favorites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public read ONLY when the owner's trainer card is public.
drop policy if exists trainer_card_favorites_public_read on trainer_card_favorites;
create policy trainer_card_favorites_public_read on trainer_card_favorites
  for select using (
    exists (
      select 1 from profiles p
      where p.id = trainer_card_favorites.user_id
        and p.show_trainer_card
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Public read of COMPLETED shiny hunts (count only) for public cards.
-- ----------------------------------------------------------------------------
drop policy if exists shiny_hunts_trainer_public_read on shiny_hunts;
create policy shiny_hunts_trainer_public_read on shiny_hunts
  for select using (
    status = 'completed'
    and exists (
      select 1 from profiles p
      where p.id = shiny_hunts.owner_id
        and p.show_trainer_card
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Public read of TCG totals for public cards (guarded: tables may not exist).
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.tcg_collection') is not null then
    drop policy if exists tcg_collection_trainer_public_read on tcg_collection;
    create policy tcg_collection_trainer_public_read on tcg_collection
      for select using (
        list = 'collection'
        and exists (
          select 1 from profiles p
          where p.id = tcg_collection.user_id
            and p.show_trainer_card
        )
      );
  end if;

  if to_regclass('public.tcg_master_set') is not null then
    drop policy if exists tcg_master_set_trainer_public_read on tcg_master_set;
    create policy tcg_master_set_trainer_public_read on tcg_master_set
      for select using (
        exists (
          select 1 from profiles p
          where p.id = tcg_master_set.user_id
            and p.show_trainer_card
        )
      );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 5. Seed the trainer-card achievement (guarded).
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.achievements') is not null then
    insert into achievements (id, name, description, icon, category) values
      ('trainer-card', 'Card-Carrying Trainer', 'Create your trainer card', '🏅', 'Community')
    on conflict (id) do nothing;
  end if;
end $$;
