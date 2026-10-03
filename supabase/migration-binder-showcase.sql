-- ============================================================================
-- Pokémon Companion — Binder Showcase migration
-- ----------------------------------------------------------------------------
-- WHAT THIS ADDS:
--   * profiles.show_binder (boolean, default false) — opt-in toggle that
--     makes the user's binder page (/binder/[username]) public.
--   * binder_showcase — up to 9 pinned favorite cards per user, shown on the
--     public binder page. One row per pin: a snapshot of the card
--     (id/name/image/set) plus position (0-8, unique per user).
--   * Row Level Security:
--       - binder_showcase: publicly readable ONLY when the owner's
--         profiles.show_binder is true (EXISTS check on profiles);
--         the owner keeps full read/write access.
--       - tcg_collection / tcg_master_set: when a binder is public, visitors
--         may also read that owner's collection entries (list = 'collection'
--         only — never the want list) and master-set marks, so the shareable
--         binder page can show total cards and portfolio value. Write paths
--         are untouched (still owner-only).
--   * Seeds the 'show-off' achievement (TCG category). Guarded: no-op if the
--     achievements table doesn't exist yet.
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
-- 1. profiles.show_binder — public binder opt-in (default: private).
-- ----------------------------------------------------------------------------
alter table profiles add column if not exists show_binder boolean not null default false;
comment on column profiles.show_binder is
  'When true, the trainer''s public binder page (/binder/[username]) is visible to everyone.';

-- ----------------------------------------------------------------------------
-- 2. binder_showcase — pinned showcase cards
-- ----------------------------------------------------------------------------
create table if not exists binder_showcase (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  card_id text not null,
  card_name text not null,
  image_url text,
  set_name text,
  position integer not null check (position >= 0 and position < 9),
  created_at timestamptz not null default now(),
  unique (user_id, position),
  unique (user_id, card_id)
);
comment on table binder_showcase is
  'Binder Showcase: up to 9 pinned favorite TCG cards per user, displayed on their public binder page.';

create index if not exists idx_binder_showcase_user on binder_showcase (user_id, position);

alter table binder_showcase enable row level security;

-- Public read ONLY when the owner's binder is public.
drop policy if exists binder_showcase_public_read on binder_showcase;
create policy binder_showcase_public_read
  on binder_showcase for select
  using (
    exists (
      select 1 from profiles p
      where p.id = binder_showcase.user_id
        and p.show_binder
    )
  );

-- Owner full access.
drop policy if exists binder_showcase_owner_all on binder_showcase;
create policy binder_showcase_owner_all
  on binder_showcase for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. Public read of collection / master-set rows for public binders
-- (so the shareable page can show total cards + portfolio value).
-- Guarded: no-ops if those tables don't exist yet. Write policies untouched.
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.tcg_collection') is not null then
    drop policy if exists tcg_collection_binder_public_read on tcg_collection;
    create policy tcg_collection_binder_public_read
      on tcg_collection for select
      using (
        list = 'collection'
        and exists (
          select 1 from profiles p
          where p.id = tcg_collection.user_id
            and p.show_binder
        )
      );
  end if;

  if to_regclass('public.tcg_master_set') is not null then
    drop policy if exists tcg_master_set_binder_public_read on tcg_master_set;
    create policy tcg_master_set_binder_public_read
      on tcg_master_set for select
      using (
        exists (
          select 1 from profiles p
          where p.id = tcg_master_set.user_id
            and p.show_binder
        )
      );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Seed the show-off achievement (guarded).
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.achievements') is not null then
    insert into achievements (id, name, description, icon, category) values
      ('show-off', 'Binder Showcase', 'Publish your binder page', '📸', 'TCG')
    on conflict (id) do nothing;
  end if;
end $$;
