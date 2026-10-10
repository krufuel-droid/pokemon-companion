-- ============================================================================
-- Pokémon Companion — Shared team codes migration
-- ----------------------------------------------------------------------------
-- WHAT THIS ADDS:
--   * shared_teams — teams shared via short codes (e.g. "ABC123") so
--     external tools (Caleb's Aura Corner battle coach) can fetch a team
--     by code: GET /api/teams/{code}. Columns: code (text PK), name,
--     team (jsonb array of TeamMember), created_at.
--   * Row Level Security:
--       - Anyone may read (codes are shareable by design — no auth needed
--         to fetch a team by code, per the Aura Corner API contract).
--       - Anyone may insert (the team builder works without login).
--       - No updates or deletes through the API.
--
-- HOW TO RUN THIS (for the app owner, no coding needed):
--   1. Open your Supabase project at https://supabase.com/dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this whole file, and click "Run"
--   4. Done. It is safe to run this file more than once — every statement is
--      guarded so re-running won't create duplicates or throw errors.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. shared_teams — shareable teams keyed by short code
-- ----------------------------------------------------------------------------
create table if not exists shared_teams (
  code text primary key,
  name text not null default 'My Team',
  team jsonb not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. Row Level Security
-- ----------------------------------------------------------------------------
alter table shared_teams enable row level security;

-- Anyone may read a shared team (codes are shareable by design).
drop policy if exists "Anyone may read shared teams" on shared_teams;
create policy "Anyone may read shared teams"
  on shared_teams for select
  using (true);

-- Anyone may create a shared team (team builder works without login).
drop policy if exists "Anyone may create shared teams" on shared_teams;
create policy "Anyone may create shared teams"
  on shared_teams for insert
  with check (true);
