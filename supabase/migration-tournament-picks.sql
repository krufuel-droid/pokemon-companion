-- Tournament Pick'em (Oct 2026). Safe to re-run.
--
-- Lets users predict the winner of each upcoming Championship Series event.
-- Scoring is computed client-side: 10 pts per pick matching a winner recorded
-- in TOURNAMENT_RESULTS (lib/data/champions.ts). Amanda must run this file in
-- the Supabase SQL Editor before the pick UI works.

-- ----------------------------------------------------------------------------
-- tournament_picks
-- ----------------------------------------------------------------------------
create table if not exists tournament_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  -- Stable key for the tournament. For listed events this is the tournament's
  -- `id` from UPCOMING_TOURNAMENTS (e.g. "tourn-louisville"). See the pick'em
  -- key helpers in app/champions/pickem.tsx — completed events keep the same
  -- key so picks still score after the event leaves the upcoming list.
  tournament_key text not null,
  -- The predicted winner's name, as typed/picked by the user.
  picked_player text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tournament_key)
);

comment on table tournament_picks is 'Tournament Pick''em predictions: one winner pick per user per tournament.';

create index if not exists idx_tournament_picks_tournament on tournament_picks (tournament_key);
create index if not exists idx_tournament_picks_user on tournament_picks (user_id);

alter table tournament_picks enable row level security;

-- Anyone signed in can read all picks (the leaderboard needs them).
drop policy if exists tournament_picks_select on tournament_picks;
create policy tournament_picks_select on tournament_picks
  for select using (auth.uid() is not null);

-- Users can insert only their own picks. WITH CHECK (not just USING) so the
-- user_id can't be forged on write — see the S1 friendship-forgery lesson.
drop policy if exists tournament_picks_insert on tournament_picks;
create policy tournament_picks_insert on tournament_picks
  for insert with check (auth.uid() = user_id);

-- Users can update only their own picks (same forged-write protection).
drop policy if exists tournament_picks_update on tournament_picks;
create policy tournament_picks_update on tournament_picks
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete only their own picks.
drop policy if exists tournament_picks_delete on tournament_picks;
create policy tournament_picks_delete on tournament_picks
  for delete using (auth.uid() = user_id);

-- Keep updated_at fresh on edits.
drop trigger if exists tournament_picks_touch_updated_at on tournament_picks;
create or replace function public.tournament_picks_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;
create trigger tournament_picks_touch_updated_at
  before update on tournament_picks
  for each row execute function public.tournament_picks_touch_updated_at();
