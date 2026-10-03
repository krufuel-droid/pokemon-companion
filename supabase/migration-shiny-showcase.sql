-- ============================================================================
-- Pokémon Companion — Shiny Showcase gallery migration
-- ----------------------------------------------------------------------------
-- WHAT THIS ADDS:
--   * shiny_showcase — the community brag wall: a shared gallery where users
--     post shiny catches. One row per post: the Pokémon (species id + name),
--     the story behind the hunt, the hunting method (label or free text),
--     an optional encounter count, and an optional link to the poster's
--     shiny_hunts row (a snapshot at post time, not a live foreign key).
--   * Row Level Security: anyone can read posts; only the poster can
--     insert/update/delete their own posts.
--   * Seeds the 'first-showcase' achievement (Social category) to match
--     lib/achievements.ts.
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
-- shiny_showcase
-- One row per community showcase post.
-- ----------------------------------------------------------------------------
create table if not exists shiny_showcase (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id integer not null,
  species_name text not null,
  story text not null,
  method text,
  encounters integer,
  hunt_id uuid,
  created_at timestamptz not null default now()
);
comment on table shiny_showcase is
  'Community Shiny Showcase: users share shiny catches and the story behind the hunt.';

create index if not exists idx_shiny_showcase_created on shiny_showcase (created_at desc);
create index if not exists idx_shiny_showcase_user on shiny_showcase (user_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table shiny_showcase enable row level security;

-- Everyone can read the gallery.
drop policy if exists shiny_showcase_read_all on shiny_showcase;
create policy shiny_showcase_read_all
  on shiny_showcase for select
  using (true);

-- Only the poster can write their own posts.
drop policy if exists shiny_showcase_insert_owner on shiny_showcase;
create policy shiny_showcase_insert_owner
  on shiny_showcase for insert
  with check (auth.uid() = user_id);

drop policy if exists shiny_showcase_update_owner on shiny_showcase;
create policy shiny_showcase_update_owner
  on shiny_showcase for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists shiny_showcase_delete_owner on shiny_showcase;
create policy shiny_showcase_delete_owner
  on shiny_showcase for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Seed: the first-showcase achievement (matches lib/achievements.ts).
-- Safe to re-run: on conflict (id) do nothing.
-- ----------------------------------------------------------------------------
insert into achievements (id, name, description, icon, category) values
  ('first-showcase', 'Showcase Star', 'Share your first shiny in the Shiny Showcase', '✨', 'Social')
on conflict (id) do nothing;
