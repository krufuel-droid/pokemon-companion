-- Living Dex race: weekly per-user completion snapshots for the
-- friends leaderboard (DexRace). Idempotent: safe to re-run.
-- NOTE: this table does NOT backfill history. Movement (▲/▼) appears once
-- a user has snapshots for two consecutive weeks.

create table if not exists dex_race_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  week_start date not null,
  caught_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);
comment on table dex_race_snapshots is 'Weekly Living Dex caught-count snapshots powering the friends Dex race leaderboard.';
comment on column dex_race_snapshots.week_start is 'Monday of the week this snapshot belongs to (the viewer''s local date).';

alter table dex_race_snapshots enable row level security;

-- Owner can write their own snapshots.
drop policy if exists dex_race_snapshots_owner_all on dex_race_snapshots;
create policy dex_race_snapshots_owner_all on dex_race_snapshots
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Accepted friends can read each other's snapshots (friendships rows for
-- accepted status are publicly readable, so the join works for viewers).
drop policy if exists dex_race_snapshots_friends_read on dex_race_snapshots;
create policy dex_race_snapshots_friends_read on dex_race_snapshots
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = dex_race_snapshots.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = dex_race_snapshots.user_id)
        )
    )
  );

-- Seed the race achievement definition so unlockAchievement (which has a
-- foreign key user_achievements.achievement_id -> achievements(id)) can
-- succeed. No-op when the achievements migration hasn't been run yet.
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'achievements') then
    insert into achievements (id, name, description, icon, category)
    values ('dex-race-leader', 'Dex Sprinter',
            'Top the friends Living Dex race leaderboard for a week',
            '🏁', 'Collection')
    on conflict (id) do nothing;
  end if;
end $$;
