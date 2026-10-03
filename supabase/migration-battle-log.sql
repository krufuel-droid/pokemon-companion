-- Nuzlocke battle log (added Oct 2026)
create table if not exists nuzlocke_battles (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references nuzlockes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  opponent text not null,
  battle_type text not null default 'trainer' check (battle_type in ('gym', 'rival', 'elite', 'champion', 'trainer', 'wild', 'other')),
  result text not null default 'win' check (result in ('win', 'loss')),
  deaths integer not null default 0,
  notes text,
  battled_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table nuzlocke_battles is 'Battle log entries for Nuzlocke runs.';
alter table nuzlocke_battles enable row level security;

-- Participants can read all battles in their run; only owners can write their own
drop policy if exists nuzlocke_battles_read on nuzlocke_battles;
create policy nuzlocke_battles_read on nuzlocke_battles
  for select using (
    public.is_run_participant(run_id, auth.uid())
  );

drop policy if exists nuzlocke_battles_write on nuzlocke_battles;
create policy nuzlocke_battles_write on nuzlocke_battles
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
