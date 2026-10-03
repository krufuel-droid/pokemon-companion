-- ============================================================================
-- Pokémon Companion — Community trade board migration
-- ----------------------------------------------------------------------------
-- WHAT THIS ADDS:
--   * trade_posts — community-wide trade board posts: what the trainer is
--     offering and what they're looking for, the game they're trading in,
--     optional notes, and an "trade evolution help" flag (trade & trade back
--     for Pokémon that evolve by trading). Posts are 'open' until the poster
--     marks them 'fulfilled'.
--   * Row Level Security on the new table: anyone can read posts; only the
--     poster can insert/update/delete their own posts.
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
-- trade_posts
-- One row per community trade board post.
-- ----------------------------------------------------------------------------
create table if not exists trade_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  offering_species_id int not null,
  offering_name text not null,
  looking_species_id int not null,
  looking_name text not null,
  game text not null,
  notes text,
  evo_help boolean not null default false,
  status text not null default 'open' check (status in ('open', 'fulfilled')),
  created_at timestamptz not null default now()
);

comment on table trade_posts is 'Community trade board posts: offering ⇄ looking per game, with trade-evolution help flag.';

create index if not exists trade_posts_created_idx on trade_posts (created_at desc);
create index if not exists trade_posts_user_idx on trade_posts (user_id);
create index if not exists trade_posts_game_idx on trade_posts (game);
create index if not exists trade_posts_status_idx on trade_posts (status);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table trade_posts enable row level security;

drop policy if exists trade_posts_read_all on trade_posts;
create policy trade_posts_read_all
  on trade_posts for select
  using (true);

drop policy if exists trade_posts_insert_owner on trade_posts;
create policy trade_posts_insert_owner
  on trade_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists trade_posts_update_owner on trade_posts;
create policy trade_posts_update_owner
  on trade_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists trade_posts_delete_owner on trade_posts;
create policy trade_posts_delete_owner
  on trade_posts for delete
  using (auth.uid() = user_id);
