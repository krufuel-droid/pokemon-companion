-- Living Dex / collection tracker (added Oct 2026)
create table if not exists collection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  species_id integer not null,
  is_shiny boolean not null default false,
  game text,
  notes text,
  caught_at timestamptz not null default now(),
  unique (user_id, species_id, is_shiny)
);
comment on table collection is 'Living Dex: which Pokémon a user has caught/owned.';
alter table collection enable row level security;

drop policy if exists collection_owner_all on collection;
create policy collection_owner_all on collection
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
