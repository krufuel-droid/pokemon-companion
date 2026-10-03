-- Pokémon of the Day catches (Oct 2026). Safe to re-run.
--
-- Trainers log when they catch the homepage's Pokémon of the Day in their
-- own game, with proof (game + location). Powers the Daily Catch
-- achievements and the Daily Star profile emblem (5 catches).

create table if not exists daily_catches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id int not null,
  species_name text not null,
  potd_date date not null,
  game text not null,
  location text not null,
  created_at timestamptz not null default now(),
  -- One log per trainer per day.
  unique (user_id, potd_date)
);
comment on table daily_catches is 'Logged Pokémon-of-the-Day catches, with game + location as proof.';

create index if not exists idx_daily_catches_user on daily_catches (user_id);

alter table daily_catches enable row level security;

-- Anyone can read (emblems show on public profiles); users manage only their own.
drop policy if exists daily_catches_select_all on daily_catches;
create policy daily_catches_select_all on daily_catches
  for select using (true);

drop policy if exists daily_catches_insert_own on daily_catches;
create policy daily_catches_insert_own on daily_catches
  for insert with check (auth.uid() = user_id);

drop policy if exists daily_catches_delete_own on daily_catches;
create policy daily_catches_delete_own on daily_catches
  for delete using (auth.uid() = user_id);
