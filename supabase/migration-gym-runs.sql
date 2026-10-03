-- ============================================================================
-- Pokémon Companion — Gym Run Tracker migration (added Oct 2026)
-- ----------------------------------------------------------------------------
-- WHAT THIS ADDS:
--   * gym_runs — per-user playthrough tracking: one row per run (user picks
--     a game, then logs that game's gyms/trials/titans in order). The
--     ordered challenge entries live in the `entries` jsonb column:
--       [{ challenge, kind, detail, result, team, date, notes }]
--   * Row Level Security: each user sees and edits only their own runs.
--   * Seeds the `first-gym-badge` achievement definition into the
--     `achievements` catalog (user_achievements.achievement_id is a foreign
--     key, so unlocking that achievement fails unless its row exists).
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
-- gym_runs
-- One row per playthrough run. `entries` holds the ordered challenge log.
-- ----------------------------------------------------------------------------
create table if not exists gym_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  game text not null,
  entries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table gym_runs is 'Gym Run Tracker: one row per playthrough run; ordered challenge entries in `entries` (jsonb).';

create index if not exists idx_gym_runs_user on gym_runs (user_id);

-- ----------------------------------------------------------------------------
-- Row Level Security: users can only touch their own runs.
-- ----------------------------------------------------------------------------
alter table gym_runs enable row level security;

drop policy if exists gym_runs_owner_all on gym_runs;
create policy gym_runs_owner_all on gym_runs
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- first-gym-badge achievement seed (idempotent).
-- Only seeds when the achievements catalog exists (i.e. after
-- migration-achievements-nuzlocke.sql or migration-achievement-seeds.sql
-- has been run); skipped otherwise so this file can run in any order.
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.achievements') is not null then
    insert into achievements (id, name, description, icon, category)
    values
      ('first-gym-badge', 'First Gym Badge', 'Log your first gym badge win in the Gym Run Tracker', '🏵️', 'Badges')
    on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      category = excluded.category;
  end if;
end $$;
