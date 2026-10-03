-- TCG Collection Tracker (added Oct 2026)
-- Per-user Pokémon TCG card collection + want list. Card metadata comes
-- from the public Pokémon TCG API (https://pokemontcg.io); this table stores
-- only the user's own entries (card id, snapshot of name/set/image, qty).
-- Idempotent: safe to re-run (create if not exists, drop/recreate policies,
-- seeds use on conflict do nothing).

create table if not exists tcg_collection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  card_id text not null,
  card_name text not null,
  set_id text,
  set_name text,
  image_url text,
  quantity integer not null default 1 check (quantity > 0),
  list text not null default 'collection' check (list in ('collection', 'want')),
  created_at timestamptz not null default now(),
  unique (user_id, card_id, list)
);
comment on table tcg_collection is 'TCG Collection Tracker: per-user card entries for My Collection and Want List.';

alter table tcg_collection enable row level security;

drop policy if exists tcg_collection_owner_all on tcg_collection;
create policy tcg_collection_owner_all on tcg_collection
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed the TCG achievement in the catalog (FK target for unlocks).
-- Guarded: no-op if the achievements migration hasn't been run yet.
do $$
begin
  if to_regclass('public.achievements') is not null then
    insert into achievements (id, name, description, icon, category) values
      ('first-card', 'First Card', 'Add your first card to your TCG collection', '🃏', 'TCG')
    on conflict (id) do nothing;
  end if;
end $$;
