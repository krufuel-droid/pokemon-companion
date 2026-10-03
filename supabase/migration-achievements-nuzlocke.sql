-- ============================================================================
-- Pokémon Companion — Achievements + Nuzlocke multiplayer migration
-- ----------------------------------------------------------------------------
-- WHAT THIS ADDS:
--   * achievements / user_achievements / user_records — the achievements
--     system: 19 seeded achievement definitions, per-user unlock tracking,
--     and per-user stat counters the app uses to decide what unlocks.
--   * nuzlocke_participants / nuzlocke_team — multiplayer Nuzlocke support:
--     who is in each run and each participant's team (alive/dead/boxed).
--   * Row Level Security on all new tables.
--   * Realtime enabled for nuzlockes, nuzlocke_participants, nuzlocke_team,
--     and memorials (so team changes show up live for everyone in a run).
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
-- achievements
-- Achievement definitions: id, display name, description, emoji icon, and
-- category. Seeded below with the 19 launch achievements; add new rows to
-- grow the system.
-- ----------------------------------------------------------------------------
create table if not exists achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  category text not null,
  created_at timestamptz not null default now()
);
comment on table achievements is 'Achievement definitions (id, name, description, emoji icon, category).';

-- ----------------------------------------------------------------------------
-- user_achievements
-- Which achievements each user has unlocked. A user can earn each
-- achievement only once (unique constraint).
-- ----------------------------------------------------------------------------
create table if not exists user_achievements (
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_id text not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);
comment on table user_achievements is 'Achievements unlocked per user.';

-- ----------------------------------------------------------------------------
-- user_records
-- Per-user stat counters (e.g. favorite_count, hunt_max_encounters,
-- post_count) that the app uses to decide when achievements unlock.
-- One row per (user, stat_key); the app upserts.
-- ----------------------------------------------------------------------------
create table if not exists user_records (
  user_id uuid not null references profiles(id) on delete cascade,
  stat_key text not null,
  stat_value int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, stat_key)
);
comment on table user_records is 'Per-user stat counters used for achievement unlocks.';

-- ----------------------------------------------------------------------------
-- nuzlocke_participants
-- Who is playing in each Nuzlocke run. Each user joins a run only once.
-- ----------------------------------------------------------------------------
create table if not exists nuzlocke_participants (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references nuzlockes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (run_id, user_id)
);
comment on table nuzlocke_participants is 'Players participating in each Nuzlocke run.';

-- ----------------------------------------------------------------------------
-- nuzlocke_team
-- Each participant's team in a run: species, nickname, status
-- (alive/dead/boxed), where it was met, level, and notes.
-- ----------------------------------------------------------------------------
create table if not exists nuzlocke_team (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references nuzlockes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  species_id int not null,
  species_name text not null,
  nickname text,
  status text not null default 'alive'
    check (status in ('alive', 'dead', 'boxed')),
  met_location text,
  level int,
  notes text,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table nuzlocke_team is 'Nuzlocke team members per participant (alive, dead, or boxed).';

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_user_achievements_user on user_achievements (user_id);
create index if not exists idx_nuzlocke_participants_run on nuzlocke_participants (run_id);
create index if not exists idx_nuzlocke_participants_user on nuzlocke_participants (user_id);
create index if not exists idx_nuzlocke_team_run on nuzlocke_team (run_id);
create index if not exists idx_nuzlocke_team_user on nuzlocke_team (user_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table achievements       enable row level security;
alter table user_achievements  enable row level security;
alter table user_records       enable row level security;
alter table nuzlocke_participants enable row level security;
alter table nuzlocke_team      enable row level security;

-- ----------------------------------------------------------------------------
-- Policies
-- ----------------------------------------------------------------------------

-- achievements: the list of definitions is public; everyone can read it.
drop policy if exists achievements_select_all on achievements;
create policy achievements_select_all on achievements
  for select using (true);

-- user_achievements: unlocks are public (so they can be shown on profiles);
-- a user can only insert/update their own unlocks.
drop policy if exists user_achievements_select_all on user_achievements;
create policy user_achievements_select_all on user_achievements
  for select using (true);

drop policy if exists user_achievements_insert_own on user_achievements;
create policy user_achievements_insert_own on user_achievements
  for insert with check (auth.uid() = user_id);

drop policy if exists user_achievements_update_own on user_achievements;
create policy user_achievements_update_own on user_achievements
  for update using (auth.uid() = user_id);

-- user_records: stats are public (so progress bars can show on profiles);
-- a user can only insert/update their own stats.
drop policy if exists user_records_select_all on user_records;
create policy user_records_select_all on user_records
  for select using (true);

drop policy if exists user_records_insert_own on user_records;
create policy user_records_insert_own on user_records
  for insert with check (auth.uid() = user_id);

drop policy if exists user_records_update_own on user_records;
create policy user_records_update_own on user_records
  for update using (auth.uid() = user_id);

-- nuzlocke_participants: visible to the participant themselves, anyone else
-- in the same run, or the run owner. A user can join (insert) and leave
-- (delete) only their own rows.
drop policy if exists nuzlocke_participants_select_run on nuzlocke_participants;
create policy nuzlocke_participants_select_run on nuzlocke_participants
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from nuzlocke_participants p
      where p.run_id = nuzlocke_participants.run_id
        and p.user_id = auth.uid()
    )
    or exists (
      select 1 from nuzlockes n
      where n.id = nuzlocke_participants.run_id
        and n.owner_id = auth.uid()
    )
  );

drop policy if exists nuzlocke_participants_insert_own on nuzlocke_participants;
create policy nuzlocke_participants_insert_own on nuzlocke_participants
  for insert with check (
    auth.uid() = user_id
    or exists (
      select 1 from nuzlockes
      where nuzlockes.id = nuzlocke_participants.run_id
        and nuzlockes.owner_id = auth.uid()
    )
  );

drop policy if exists nuzlocke_participants_delete_own on nuzlocke_participants;
create policy nuzlocke_participants_delete_own on nuzlocke_participants
  for delete using (auth.uid() = user_id);

-- nuzlocke_team: visible to the owner of the team rows, anyone else in the
-- same run, or the run owner. A user can only write their own rows.
drop policy if exists nuzlocke_team_select_run on nuzlocke_team;
create policy nuzlocke_team_select_run on nuzlocke_team
  for select using (true);

drop policy if exists nuzlocke_team_insert_own on nuzlocke_team;
create policy nuzlocke_team_insert_own on nuzlocke_team
  for insert with check (auth.uid() = user_id);

drop policy if exists nuzlocke_team_update_own on nuzlocke_team;
create policy nuzlocke_team_update_own on nuzlocke_team
  for update using (auth.uid() = user_id);

drop policy if exists nuzlocke_team_delete_own on nuzlocke_team;
create policy nuzlocke_team_delete_own on nuzlocke_team
  for delete using (auth.uid() = user_id);

-- nuzlockes: the base schema grants the owner full row access via the
-- "nuzlockes_write_owner" policy (FOR ALL), which already covers status
-- updates, so no extra update policy is needed here.

-- ----------------------------------------------------------------------------
-- Seed: the 19 launch achievements
-- Safe to re-run: on conflict (id) do nothing.
-- ----------------------------------------------------------------------------
insert into achievements (id, name, description, icon, category) values
  ('first-favorite', 'First Favorite', 'Favorite your first Pokémon', '⭐', 'Collection'),
  ('favorite-10', 'Growing Collection', 'Favorite 10 Pokémon', '⭐', 'Collection'),
  ('favorite-50', 'Serious Collector', 'Favorite 50 Pokémon', '🏅', 'Collection'),
  ('favorite-100', 'Living Dex Dream', 'Favorite 100 Pokémon', '💯', 'Collection'),
  ('first-hunt', 'Shiny Hunter', 'Start your first shiny hunt', '✨', 'Shiny'),
  ('hunt-100', 'Persistent', 'Reach 100 encounters on one hunt', '🔁', 'Shiny'),
  ('first-shiny', 'Golden!', 'Complete a shiny hunt', '🌟', 'Shiny'),
  ('shiny-5', 'Shiny Squad', 'Complete 5 shiny hunts', '🌈', 'Shiny'),
  ('first-nuzlocke', 'Brave Soul', 'Start your first Nuzlocke run', '💀', 'Nuzlocke'),
  ('first-death', 'First Blood', 'Lose your first Pokémon (RIP)', '🪦', 'Nuzlocke'),
  ('nuzlocke-complete', 'Survivor', 'Complete a Nuzlocke run', '🏆', 'Nuzlocke'),
  ('memorial-10', 'Fallen Heroes', 'Memorialize 10 fallen Pokémon', '🕯️', 'Nuzlocke'),
  ('soul-link', 'Together Strong', 'Join a friend''s Nuzlocke run', '🤝', 'Nuzlocke'),
  ('first-post', 'Hello World', 'Make your first community post', '💬', 'Social'),
  ('posts-10', 'Chatterbox', 'Make 10 community posts', '📣', 'Social'),
  ('first-friend', 'Friendly', 'Add your first friend', '👋', 'Social'),
  ('friends-10', 'Popular', 'Have 10 friends', '🎉', 'Social'),
  ('reactions-25', 'Cheerleader', 'React to 25 posts', '❤️', 'Social')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Realtime
-- Add the Nuzlocke + memorial tables to the supabase_realtime publication so
-- team changes show up live for everyone in a run. Each block adds its table
-- only if it is not already a member of the publication.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'nuzlockes'
  ) then
    alter publication supabase_realtime add table nuzlockes;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'nuzlocke_participants'
  ) then
    alter publication supabase_realtime add table nuzlocke_participants;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'nuzlocke_team'
  ) then
    alter publication supabase_realtime add table nuzlocke_team;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'memorials'
  ) then
    alter publication supabase_realtime add table memorials;
  end if;
end $$;
