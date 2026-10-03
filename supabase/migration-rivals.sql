-- Rival system (Oct 2026). Safe to re-run.
--
-- Declare a friend your rival; each completed Monday–Sunday (America/Chicago)
-- week auto-settles into rival_weeks with a winner and a silly loser title.
-- Weekly scoring reads daily_catches (public read) + collection (rivals-scoped
-- read policy below) for the finished week — no cron needed, the settle runs
-- lazily the first time anyone views the Rivals section.

create table if not exists rivals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  rival_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, rival_id),
  check (user_id <> rival_id)
);
comment on table rivals is 'Rival declarations: user_id threw down the gauntlet at rival_id.';

create table if not exists rival_weeks (
  id uuid primary key default gen_random_uuid(),
  week_start date not null, -- Monday of the settled week (America/Chicago)
  user_id uuid not null references profiles(id) on delete cascade,
  rival_id uuid not null references profiles(id) on delete cascade,
  user_score int not null default 0,
  rival_score int not null default 0,
  winner_id uuid references profiles(id) on delete cascade,
  loser_title text,
  settled_at timestamptz,
  unique (week_start, user_id, rival_id),
  check (user_id <> rival_id)
);
comment on table rival_weeks is 'Settled weekly rivalry results, written lazily on first view after the week ends.';

create index if not exists idx_rivals_user on rivals (user_id);
create index if not exists idx_rivals_rival on rivals (rival_id);
create index if not exists idx_rival_weeks_user on rival_weeks (user_id);
create index if not exists idx_rival_weeks_week on rival_weeks (week_start);

alter table rivals enable row level security;
alter table rival_weeks enable row level security;

-- rivals: only the two involved can see the rivalry; the declarer writes it;
-- either side can end it.
drop policy if exists rivals_select_participants on rivals;
create policy rivals_select_participants on rivals
  for select using (auth.uid() = user_id or auth.uid() = rival_id);

drop policy if exists rivals_insert_declarer on rivals;
create policy rivals_insert_declarer on rivals
  for insert with check (auth.uid() = user_id);

drop policy if exists rivals_delete_participants on rivals;
create policy rivals_delete_participants on rivals
  for delete using (auth.uid() = user_id or auth.uid() = rival_id);

-- rival_weeks: participants manage their rows; accepted friends of either
-- side can peek at the settled weekly results (bragging rights need witnesses).
drop policy if exists rival_weeks_select_public on rival_weeks;
create policy rival_weeks_select_public on rival_weeks
  for select using (
    auth.uid() = user_id
    or auth.uid() = rival_id
    or exists (
      select 1 from friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id in (rival_weeks.user_id, rival_weeks.rival_id))
          or (f.addressee_id = auth.uid() and f.requester_id in (rival_weeks.user_id, rival_weeks.rival_id))
        )
    )
  );

drop policy if exists rival_weeks_insert_participants on rival_weeks;
create policy rival_weeks_insert_participants on rival_weeks
  for insert with check (auth.uid() = user_id or auth.uid() = rival_id);

drop policy if exists rival_weeks_update_participants on rival_weeks;
create policy rival_weeks_update_participants on rival_weeks
  for update using (auth.uid() = user_id or auth.uid() = rival_id);

-- collection (Living Dex): rivals may read each other's rows so the weekly
-- "new dex entries" score can be computed for both sides. No other access
-- changes; the owner-only policy still applies to everyone else.
drop policy if exists collection_select_rivals on collection;
create policy collection_select_rivals on collection
  for select using (
    exists (
      select 1 from rivals r
      where (r.user_id = auth.uid() and r.rival_id = collection.user_id)
         or (r.rival_id = auth.uid() and r.user_id = collection.user_id)
    )
  );
