-- Mark & Ribbon Tracker: per-user mark collection (added Oct 2026)
--
-- Tracks which of the 50 Scarlet/Violet obtainable marks (see
-- lib/data/marks.ts) a user has caught. Mark ids are the slugs from the
-- data file (e.g. 'sleepy-time', 'rare', 'mightiest').
--
-- Idempotent: safe to re-run (create table if not exists, drop/recreate
-- policy, on conflict do nothing).
create table if not exists user_marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mark_id text not null,
  caught_at timestamptz not null default now(),
  unique (user_id, mark_id)
);
comment on table user_marks is 'Mark & Ribbon tracker: which S/V marks a user has caught.';
create index if not exists idx_user_marks_user on user_marks (user_id);

alter table user_marks enable row level security;

drop policy if exists user_marks_owner_all on user_marks;
create policy user_marks_owner_all on user_marks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Seed the first-mark achievement (wired in lib/achievements.ts).
-- ----------------------------------------------------------------------------
insert into achievements (id, name, description, icon, category) values
  ('first-mark', 'Marked!', 'Catch your first marked Pokémon', '🎖️', 'Collection')
on conflict (id) do nothing;
