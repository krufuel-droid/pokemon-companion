-- ============================================================================
-- Pokémon Companion — Supabase database schema
-- ----------------------------------------------------------------------------
-- HOW TO RUN THIS (for the app owner, no coding needed):
--   1. Open your Supabase project at https://supabase.com/dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this whole file, and click "Run"
--   4. Done. It's safe to run this file more than once — every statement is
--      guarded so re-running won't create duplicates or throw errors.
-- Requires: pgcrypto extension (standard on Supabase) for gen_random_uuid().
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- profiles
-- Public trainer profile. One row per signed-up user; the id matches the id
-- of the matching row in Supabase's built-in auth.users table.
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now()
);
comment on table profiles is 'Trainer profiles; one row per auth user.';

-- Phase 2 additions: editable profile fields. Safe to re-run.
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists bio text check (char_length(bio) <= 500);
alter table profiles add column if not exists favorite_pokemon text;

-- ----------------------------------------------------------------------------
-- posts
-- Community feed posts. Body is limited to 1–2000 characters.
-- ----------------------------------------------------------------------------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
comment on table posts is 'Community feed posts (1–2000 characters).';

-- ----------------------------------------------------------------------------
-- reactions
-- Emoji reactions on posts. A user can react to the same post with the same
-- emoji only once (the unique constraint enforces that).
-- ----------------------------------------------------------------------------
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);
comment on table reactions is 'Emoji reactions on posts.';

-- ----------------------------------------------------------------------------
-- friendships
-- Friend requests between two users. requester_id sent the request,
-- addressee_id receives it. status: pending → accepted, or blocked.
-- ----------------------------------------------------------------------------
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
comment on table friendships is 'Friend requests; status is pending, accepted, or blocked.';

-- ----------------------------------------------------------------------------
-- messages
-- Direct messages between two users. No update/delete for the receiver;
-- the sender can delete their own sent messages.
-- ----------------------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
comment on table messages is 'Direct messages between two users.';

-- ----------------------------------------------------------------------------
-- nuzlockes
-- Nuzlocke challenge runs: title, optional house rules text, and a status
-- (e.g. active, completed, wiped).
-- ----------------------------------------------------------------------------
create table if not exists nuzlockes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  rules text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
comment on table nuzlockes is 'Nuzlocke challenge runs with optional house rules.';

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
-- Avatar uploads: public "avatars" storage bucket
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
-- shiny_hunts
-- Shiny hunt trackers: which species is being hunted, the encounter count,
-- and whether the hunt is done.
-- ----------------------------------------------------------------------------
create table if not exists shiny_hunts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  species_id int not null,
  species_name text not null,
  encounters int not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table shiny_hunts is 'Shiny hunt trackers with encounter counts.';

-- ----------------------------------------------------------------------------
-- collections
-- Named collections (e.g. "Gen 1 starters", "shiny box"). Individual species
-- entries inside a collection are a Phase 2 addition.
-- ----------------------------------------------------------------------------
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
comment on table collections is 'Named Pokémon collections.';

-- ----------------------------------------------------------------------------
-- favorites
-- Favorite species per user; each user can favorite a species only once.
-- ----------------------------------------------------------------------------
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id int not null,
  created_at timestamptz not null default now(),
  unique (user_id, species_id)
);
comment on table favorites is 'Favorite Pokémon species per user.';

-- ----------------------------------------------------------------------------
-- memorials
-- Memorials for fallen Nuzlocke Pokémon: species name, nickname, and an
-- optional note of remembrance.
-- ----------------------------------------------------------------------------
create table if not exists memorials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  species_name text not null,
  nickname text,
  note text,
  created_at timestamptz not null default now()
);
comment on table memorials is 'Memorials for fallen Pokémon (Nuzlocke deaths).';

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_posts_author_created on posts (author_id, created_at desc);
create index if not exists idx_reactions_post on reactions (post_id);
create index if not exists idx_friendships_requester on friendships (requester_id);
create index if not exists idx_friendships_addressee on friendships (addressee_id);
create index if not exists idx_messages_participants_created on messages (sender_id, receiver_id, created_at);
create index if not exists idx_shiny_hunts_owner on shiny_hunts (owner_id);
create index if not exists idx_nuzlockes_owner on nuzlockes (owner_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table profiles     enable row level security;
alter table posts        enable row level security;
alter table reactions    enable row level security;
alter table friendships  enable row level security;
alter table messages     enable row level security;
alter table nuzlockes    enable row level security;
alter table shiny_hunts  enable row level security;
alter table collections  enable row level security;
alter table favorites    enable row level security;
alter table memorials    enable row level security;

-- ----------------------------------------------------------------------------
-- Policies
-- ----------------------------------------------------------------------------

-- profiles: everyone can read; a user can only insert/update their own row.
drop policy if exists profiles_select_all on profiles;
create policy profiles_select_all on profiles
  for select using (true);

drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update using (auth.uid() = id);

-- posts: everyone can read; authors can write/delete their own posts.
drop policy if exists posts_select_all on posts;
create policy posts_select_all on posts
  for select using (true);

drop policy if exists posts_insert_own on posts;
create policy posts_insert_own on posts
  for insert with check (auth.uid() = author_id);

drop policy if exists posts_update_own on posts;
create policy posts_update_own on posts
  for update using (auth.uid() = author_id);

drop policy if exists posts_delete_own on posts;
create policy posts_delete_own on posts
  for delete using (auth.uid() = author_id);

-- reactions: everyone can read; users can add/remove only their own reactions.
drop policy if exists reactions_select_all on reactions;
create policy reactions_select_all on reactions
  for select using (true);

drop policy if exists reactions_insert_own on reactions;
create policy reactions_insert_own on reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists reactions_delete_own on reactions;
create policy reactions_delete_own on reactions
  for delete using (auth.uid() = user_id);

-- friendships: only the two people involved can see or touch the row.
drop policy if exists friendships_select_participants on friendships;
create policy friendships_select_participants on friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists friendships_insert_participants on friendships;
create policy friendships_insert_participants on friendships
  for insert with check (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists friendships_update_participants on friendships;
create policy friendships_update_participants on friendships
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- messages: only sender/receiver can read or send; sender can delete own.
drop policy if exists messages_select_participants on messages;
create policy messages_select_participants on messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists messages_insert_participants on messages;
create policy messages_insert_participants on messages
  for insert with check (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists messages_delete_sender on messages;
create policy messages_delete_sender on messages
  for delete using (auth.uid() = sender_id);

-- nuzlockes: everyone can read; only the owner can write.
drop policy if exists nuzlockes_select_all on nuzlockes;
create policy nuzlockes_select_all on nuzlockes
  for select using (true);

drop policy if exists nuzlockes_write_owner on nuzlockes;
create policy nuzlockes_write_owner on nuzlockes
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- shiny_hunts: owner-only (all operations).
drop policy if exists shiny_hunts_owner_all on shiny_hunts;
create policy shiny_hunts_owner_all on shiny_hunts
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- collections: owner-only (all operations).
drop policy if exists collections_owner_all on collections;
create policy collections_owner_all on collections
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- favorites: owner-only (all operations).
drop policy if exists favorites_owner_all on favorites;
create policy favorites_owner_all on favorites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- memorials: owner-only (all operations).
drop policy if exists memorials_owner_all on memorials;
create policy memorials_owner_all on memorials
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- OPTIONAL: auto-create a profiles row when a new user signs up
-- ----------------------------------------------------------------------------
-- The app creates a profile row the first time a signed-in user visits
-- /profile, so this trigger is NOT required for accounts to work. Enable
-- it only if you want a profiles row to exist immediately at signup,
-- before the user ever opens /profile.
--
-- To enable: copy the block below into the Supabase SQL editor and run it
-- once. (The app keeps working exactly the same either way.)
-- ----------------------------------------------------------------------------
-- create or replace function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- begin
--   insert into public.profiles (id, username)
--   values (new.id, 'trainer_' || substr(replace(new.id::text, '-', ''), 1, 8))
--   on conflict (id) do nothing;
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists on_auth_user_created on auth.users;
--
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- feedback
-- User-submitted feedback: bug reports, feature ideas, and hellos.
-- trainer_name and user_id are optional so logged-out visitors can write in.
-- (Also available as the standalone file supabase/feedback.sql.)
-- ----------------------------------------------------------------------------
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('bug', 'idea', 'hello')),
  message text not null check (char_length(message) between 1 and 2000),
  trainer_name text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table feedback is 'User feedback: bug reports, feature ideas, and hellos.';

alter table feedback enable row level security;

-- Anyone (signed in or not) may SUBMIT feedback. There is deliberately no
-- public SELECT policy: submissions are private and are read by the owner
-- in the Supabase dashboard's Table Editor.
drop policy if exists feedback_insert_anyone on feedback;
create policy feedback_insert_anyone on feedback
  for insert with check (true);

-- ============================================================================
-- Achievements + Nuzlocke multiplayer
-- (Also available as the standalone file
-- supabase/migration-achievements-nuzlocke.sql. All statements are guarded,
-- so re-running is safe.)
-- ============================================================================

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

alter table nuzlocke_team add column if not exists gender text not null default 'unknown'
  check (gender in ('male', 'female', 'unknown'));

-- Indexes
create index if not exists idx_user_achievements_user on user_achievements (user_id);
create index if not exists idx_nuzlocke_participants_run on nuzlocke_participants (run_id);
create index if not exists idx_nuzlocke_participants_user on nuzlocke_participants (user_id);
create index if not exists idx_nuzlocke_team_run on nuzlocke_team (run_id);
create index if not exists idx_nuzlocke_team_user on nuzlocke_team (user_id);

-- Row Level Security
alter table achievements       enable row level security;
alter table user_achievements  enable row level security;
alter table user_records       enable row level security;
alter table nuzlocke_participants enable row level security;
alter table nuzlocke_team      enable row level security;

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

-- Seed: the 19 launch achievements. Safe to re-run.
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

-- Realtime: add the Nuzlocke + memorial tables to the supabase_realtime
-- publication if they are not already members.
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
