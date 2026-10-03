-- Sandwich recipe builder: saved recipes (added Oct 2026)
-- Stores a user's favorite Scarlet/Violet sandwich builder recipes.
-- ingredients is a jsonb object: {"fillings": ["Rice", ...], "condiments": ["Salt", ...]}
-- NOTE: the 'first-sandwich' achievement seed below requires the `achievements`
-- table, which is created by supabase/migration-achievements-nuzlocke.sql.
-- Run that migration first on a fresh database.
-- Idempotent: safe to re-run.

create table if not exists sandwich_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  ingredients jsonb not null default '{"fillings": [], "condiments": []}',
  created_at timestamptz not null default now()
);
comment on table sandwich_recipes is 'Saved Scarlet/Violet sandwich builder recipes per user.';
alter table sandwich_recipes enable row level security;

drop policy if exists sandwich_recipes_owner_all on sandwich_recipes;
create policy sandwich_recipes_owner_all on sandwich_recipes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Achievement seed: unlocked when a user saves their first sandwich recipe.
-- Idempotent: safe to re-run (on conflict do nothing).
insert into achievements (id, name, description, icon, category) values
  ('first-sandwich', 'Sandwich Chef', 'Save your first sandwich recipe', '🥪', 'Fun')
on conflict (id) do nothing;
