-- TCG Master Set view (added Oct 2026)
-- Per-user checklist of TCGdex card prints (card + language) for the
-- "Master Set" collector view: every print of a Pokémon in every language.
-- Card metadata/pricing comes from TCGdex (https://api.tcgdex.net/v2);
-- this table stores only the user's own owned marks.
-- Idempotent: safe to re-run.

create table if not exists tcg_master_set (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  card_id text not null,
  card_name text not null,
  set_name text,
  language text not null default 'en',
  image_url text,
  created_at timestamptz not null default now(),
  unique (user_id, card_id, language)
);
comment on table tcg_master_set is 'TCG Master Set: per-user owned marks for card prints (card + language).';

alter table tcg_master_set enable row level security;

drop policy if exists tcg_master_set_owner_all on tcg_master_set;
create policy tcg_master_set_owner_all on tcg_master_set
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed the Master Set achievement (guarded: no-op if achievements table missing).
do $$
begin
  if to_regclass('public.achievements') is not null then
    insert into achievements (id, name, description, icon, category) values
      ('master-set-first', 'Master of Sets', 'Log your first card in the Master Set view', '🌍', 'TCG')
    on conflict (id) do nothing;
  end if;
end $$;

-- Price snapshots for the Price Movers digest (added Oct 2026)
-- One snapshot per tracked card per language per day; movers compare the
-- latest snapshot against the one from ~7 days ago.
create table if not exists tcg_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  card_id text not null,
  language text not null default 'en',
  market_usd numeric,
  market_eur numeric,
  snap_date date not null default current_date,
  snapped_at timestamptz not null default now(),
  unique (user_id, card_id, language, snap_date)
);
comment on table tcg_price_snapshots is 'TCG price snapshots: daily market prices for tracked Master Set cards, backing the Price Movers digest.';

alter table tcg_price_snapshots enable row level security;

drop policy if exists tcg_price_snapshots_owner_all on tcg_price_snapshots;
create policy tcg_price_snapshots_owner_all on tcg_price_snapshots
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- (TCG card trading board removed Oct 2026: liability concerns with real-goods
-- trades between strangers. The in-game Pokémon trade board remains.)
