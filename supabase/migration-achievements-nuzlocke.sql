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

-- Gender tracking (added Oct 2026). Safe to re-run.
alter table nuzlocke_team add column if not exists gender text not null default 'unknown'
  check (gender in ('male', 'female', 'unknown'));

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

drop policy if exists user_achievements_delete_own on user_achievements;
create policy user_achievements_delete_own on user_achievements
  for delete using (auth.uid() = user_id);

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

-- ----------------------------------------------------------------------------
-- Nuzlocke invite codes + run types (Oct 2026)
-- Safe to re-run: every statement is idempotent.
-- ----------------------------------------------------------------------------
alter table nuzlockes add column if not exists invite_code text;
update nuzlockes set invite_code = substr(md5(random()::text), 1, 8) where invite_code is null;
alter table nuzlockes alter column invite_code set default substr(md5(random()::text), 1, 8);
create unique index if not exists nuzlockes_invite_code_key on nuzlockes (invite_code);
alter table nuzlockes add column if not exists run_type text not null default 'standard';

-- ----------------------------------------------------------------------------
-- Avatar uploads: public "avatars" storage bucket (Oct 2026)
-- Safe to re-run: bucket upsert + drop/create policies.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- Friends enhancements (Oct 2026): online presence + friend suggestions.
-- Safe to re-run: every statement is idempotent.
-- ----------------------------------------------------------------------------
alter table profiles add column if not exists last_seen timestamptz;

-- Section 1 (friend profile flex sheet): buddy Pokémon. Safe to re-run.
alter table profiles add column if not exists buddy_species_id integer;
alter table profiles add column if not exists buddy_nickname text;

-- Accepted friendships are publicly readable so friend-of-friend
-- suggestions can be computed. Pending/blocked rows stay private
-- to the two people involved.
drop policy if exists friendships_select_accepted_public on friendships;
create policy friendships_select_accepted_public on friendships
  for select using (status = 'accepted');

-- ----------------------------------------------------------------------------
-- Section 2: Trading system (Oct 2026) — wishlist + for-trade lists.
-- Safe to re-run: create-if-not-exists + drop/create policies.
-- ----------------------------------------------------------------------------
create table if not exists trade_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id integer not null,
  species_name text not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, species_id)
);
comment on table trade_wishlist is 'Pokémon a trainer is looking for (trade wishlist).';

create table if not exists trade_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id integer not null,
  species_name text not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, species_id)
);
comment on table trade_list is 'Pokémon a trainer is offering for trade.';

-- Game-specific trading (added Oct 2026): which game the trade is for.
alter table trade_wishlist add column if not exists game text;
alter table trade_list add column if not exists game text;

alter table trade_wishlist enable row level security;
alter table trade_list enable row level security;

-- Trade lists are publicly readable so the matchmaker can compare
-- friends' lists; only the owner can write their own rows.
drop policy if exists trade_wishlist_select_all on trade_wishlist;
create policy trade_wishlist_select_all on trade_wishlist
  for select using (true);

drop policy if exists trade_wishlist_owner_write on trade_wishlist;
create policy trade_wishlist_owner_write on trade_wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists trade_list_select_all on trade_list;
create policy trade_list_select_all on trade_list
  for select using (true);

drop policy if exists trade_list_owner_write on trade_list;
create policy trade_list_owner_write on trade_list
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Section 5: Management tools (Oct 2026) — trainer codes + friend nicknames.
-- Safe to re-run: every statement is idempotent.
-- ----------------------------------------------------------------------------

-- Trainer codes: a shareable 12-digit code per trainer (QR invites / add-by-code).
alter table profiles add column if not exists trainer_code text;

-- Backfill: give every profile lacking one a random 12-digit code, keeping
-- existing codes. The loop regenerates any duplicates (astronomically
-- unlikely with 12 digits) until every code is unique.
do $$
declare
  dup_count integer := 1;
begin
  while dup_count > 0 loop
    update profiles p
    set trainer_code = lpad((floor(random() * 1e12))::bigint::text, 12, '0')
    where p.trainer_code is null
       or exists (
         select 1 from profiles q
         where q.trainer_code = p.trainer_code
           and q.ctid < p.ctid
       );
    select count(*) into dup_count
    from profiles a
    join profiles b on a.trainer_code = b.trainer_code and a.ctid < b.ctid;
  end loop;
end $$;

create unique index if not exists profiles_trainer_code_key on profiles (trainer_code);

-- Friend nicknames: private per-user display names for friends.
create table if not exists friend_nicknames (
  user_id uuid not null references profiles(id) on delete cascade,
  friend_id uuid not null references profiles(id) on delete cascade,
  nickname text not null,
  primary key (user_id, friend_id)
);
comment on table friend_nicknames is 'Private per-user nicknames for friends (Section 5).';

alter table friend_nicknames enable row level security;

-- Nicknames are private to the trainer who set them.
drop policy if exists friend_nicknames_owner_all on friend_nicknames;
create policy friend_nicknames_owner_all on friend_nicknames
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Section 3: Friendship levels (Oct 2026) — points + tiers per friend.
-- Safe to re-run: every statement is idempotent.
-- ----------------------------------------------------------------------------

-- friendship_progress: friendship points between two trainers, one row per
-- direction — (A,B) and (B,A) are separate rows. Points come from daily
-- "Say hi" interactions; once-per-day is enforced in app code.
create table if not exists friendship_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  friend_id uuid not null references profiles(id) on delete cascade,
  points int not null default 0,
  last_interaction_date date,
  primary key (user_id, friend_id)
);
comment on table friendship_progress is 'Friendship level points (Section 3): one row per direction, earned by daily "Say hi" interactions.';

alter table friendship_progress enable row level security;

-- Both parties to a friendship can read and write their own direction's row.
drop policy if exists friendship_progress_parties on friendship_progress;
create policy friendship_progress_parties on friendship_progress
  for all using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id or auth.uid() = friend_id);

-- ----------------------------------------------------------------------------
-- Section 4: Shared goals & weekly challenges (Oct 2026).
-- Safe to re-run: every statement is idempotent.
-- ----------------------------------------------------------------------------

-- challenges: one challenge per (goal_type, week_start). The app keeps it to
-- ONE active challenge per week; the first signed-in trainer to open the
-- Challenges tab each Monday auto-creates that week's row (the INSERT policy
-- allows it, and the unique constraint prevents duplicates).
create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  goal_type text not null,
  target_count int not null,
  week_start date not null,
  created_at timestamptz not null default now(),
  unique (goal_type, week_start)
);
comment on table challenges is 'Weekly friend challenges (Section 4): one active challenge per week.';

-- challenge_progress: each trainer's count toward a challenge. One row per
-- (challenge, user); the app upserts. The 'say_hi' goal type is auto-counted
-- from friendship_progress rows instead of using this table.
create table if not exists challenge_progress (
  challenge_id uuid not null references challenges(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
comment on table challenge_progress is 'Per-trainer progress on weekly challenges (Section 4).';

alter table challenges enable row level security;
alter table challenge_progress enable row level security;

-- Challenge definitions are public; any signed-in trainer may create the
-- weekly row (auto-creation on first visit), and the unique constraint keeps
-- it to one per goal type per week. No other writes are exposed.
drop policy if exists challenges_select_all on challenges;
create policy challenges_select_all on challenges
  for select using (true);

drop policy if exists challenges_insert_authenticated on challenges;
create policy challenges_insert_authenticated on challenges
  for insert with check (auth.role() = 'authenticated');

-- Progress is public (leaderboard); only the owner can write their own rows.
drop policy if exists challenge_progress_select_all on challenge_progress;
create policy challenge_progress_select_all on challenge_progress
  for select using (true);

drop policy if exists challenge_progress_owner_write on challenge_progress;
create policy challenge_progress_owner_write on challenge_progress
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- How to add custom challenges (for Amanda)
-- ----------------------------------------------------------------------------
-- Copy the example below into a new SQL Editor query, change the values, and
-- run it. week_start is the Monday the challenge runs. Use a goal_type of
-- 'catches', 'achievements', or 'say_hi' — 'say_hi' counts itself from daily
-- "Say hi" interactions; the others count via the "+1 Log" button in the app.
--
--   insert into challenges (title, description, goal_type, target_count, week_start)
--   values (
--     '🏆 Custom title here',
--     'What everyone is racing to do this week.',
--     'catches',
--     20,
--     '2026-10-12'   -- a Monday
--   );
--
-- To end a custom challenge early, or skip the auto-created one, delete its
-- row (its progress rows delete themselves):
--
--   delete from challenges where title = '🏆 Custom title here';
