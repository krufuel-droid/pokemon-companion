-- Co-op shiny hunts: party invites + shared encounter logging (Oct 2026).
-- Idempotent: safe to re-run. Amanda runs this in the Supabase SQL Editor.
--
-- Changes:
--   * New table shiny_hunt_parties: pending/accepted party membership for a
--     hunt. Invites are NEVER auto-added — the invitee must Accept (accepting
--     flips the row to 'accepted'; declining deletes the row), mirroring the
--     Nuzlocke invite-consent flow.
--   * found_by / found_by_name columns on shiny_hunts: whoever marks the
--     shiny found is recorded, visible to every party member.
--   * Additive RLS on shiny_hunts: a shared hunt is visible to its owner,
--     accepted party members, and pending invitees; accepted members can log
--     encounters and mark the shiny found. (Existing owner-only policies are
--     untouched; the new policies are OR'd with them.)
--   * RPC log_party_encounters: atomically bumps the hunt's encounter total
--     and the caller's per-member contribution counter.
--   * Seeds the "Hunt Party" party-hunt achievement (guarded: no-op if the
--     achievements table is missing).

-- ----------------------------------------------------------------------------
-- shiny_hunt_parties
-- ----------------------------------------------------------------------------
create table if not exists shiny_hunt_parties (
  id uuid primary key default gen_random_uuid(),
  hunt_id uuid not null references shiny_hunts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  encounters_contributed integer not null default 0,
  created_at timestamptz not null default now(),
  unique (hunt_id, user_id)
);
comment on table shiny_hunt_parties is 'Co-op shiny hunt party: pending invites (the invitee must accept; decline deletes the row) and accepted members with per-member encounter contributions.';

create index if not exists idx_shiny_hunt_parties_hunt on shiny_hunt_parties (hunt_id);
create index if not exists idx_shiny_hunt_parties_user on shiny_hunt_parties (user_id);

-- Who marked the shiny found — shown to every party member as hunt history.
alter table shiny_hunts
  add column if not exists found_by uuid references profiles(id) on delete set null;
alter table shiny_hunts
  add column if not exists found_by_name text;

alter table shiny_hunt_parties enable row level security;

-- ----------------------------------------------------------------------------
-- Membership helpers (security definer, following the is_run_participant
-- pattern: avoids infinite recursion when policies query these tables).
-- ----------------------------------------------------------------------------
create or replace function public.shiny_hunt_owner_id(p_hunt_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select owner_id from public.shiny_hunts where id = p_hunt_id;
$$;

-- Owner, accepted member, or pending invitee: may SEE the hunt and party rows.
create or replace function public.shiny_hunt_can_view(p_hunt_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.shiny_hunts h
    where h.id = p_hunt_id and h.owner_id = p_user_id
  ) or exists (
    select 1 from public.shiny_hunt_parties p
    where p.hunt_id = p_hunt_id and p.user_id = p_user_id
      and p.status in ('pending', 'accepted')
  );
$$;

-- Owner or accepted member: may log encounters and mark the shiny found.
create or replace function public.shiny_hunt_can_contribute(p_hunt_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.shiny_hunts h
    where h.id = p_hunt_id and h.owner_id = p_user_id
  ) or exists (
    select 1 from public.shiny_hunt_parties p
    where p.hunt_id = p_hunt_id and p.user_id = p_user_id
      and p.status = 'accepted'
  );
$$;

-- ----------------------------------------------------------------------------
-- RLS: shiny_hunt_parties (follows the shiny_hunts policy style)
-- ----------------------------------------------------------------------------

-- A trainer always sees their own rows; owner/members/invitees see every row
-- for hunts they can view (needed for the contribution list + pending invites).
drop policy if exists shiny_hunt_parties_select on shiny_hunt_parties;
create policy shiny_hunt_parties_select on shiny_hunt_parties
  for select using (
    auth.uid() = user_id
    or public.shiny_hunt_can_view(shiny_hunt_parties.hunt_id, auth.uid())
  );

-- Only the hunt owner can invite, only other trainers, always as pending.
-- (Nobody is ever auto-added: the invitee must accept.)
drop policy if exists shiny_hunt_parties_invite on shiny_hunt_parties;
create policy shiny_hunt_parties_invite on shiny_hunt_parties
  for insert with check (
    status = 'pending'
    and encounters_contributed = 0
    and user_id <> auth.uid()
    and public.shiny_hunt_owner_id(shiny_hunt_parties.hunt_id) = auth.uid()
  );

-- The invitee answers their own invite: the only legit change is
-- pending -> accepted.
drop policy if exists shiny_hunt_parties_update_own on shiny_hunt_parties;
create policy shiny_hunt_parties_update_own on shiny_hunt_parties
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status = 'accepted');

-- The invitee can decline (deletes their row); the owner can rescind a
-- pending invite.
drop policy if exists shiny_hunt_parties_delete on shiny_hunt_parties;
create policy shiny_hunt_parties_delete on shiny_hunt_parties
  for delete using (
    auth.uid() = user_id
    or (
      public.shiny_hunt_owner_id(shiny_hunt_parties.hunt_id) = auth.uid()
      and status = 'pending'
    )
  );

-- ----------------------------------------------------------------------------
-- RLS: shiny_hunts (additive — existing owner-only policies stay as-is)
-- ----------------------------------------------------------------------------

-- A shared hunt is visible to its owner, accepted party members, and pending
-- invitees (so invitees can see what they're accepting).
drop policy if exists shiny_hunts_party_select on shiny_hunts;
create policy shiny_hunts_party_select on shiny_hunts
  for select using (public.shiny_hunt_can_view(shiny_hunts.id, auth.uid()));

-- Accepted members can log encounters and mark the shiny found on a shared
-- hunt. (Delete stays owner-only.)
drop policy if exists shiny_hunts_party_update on shiny_hunts;
create policy shiny_hunts_party_update on shiny_hunts
  for update using (public.shiny_hunt_can_contribute(shiny_hunts.id, auth.uid()));

-- ----------------------------------------------------------------------------
-- RPC: log encounters to a shared hunt (atomic).
-- Bumps the hunt total and, for non-owner members, their per-member
-- contribution counter. The owner's share is derived client-side as
-- (total - members' contributions), so it stays exact no matter which
-- counter the owner logged from.
-- ----------------------------------------------------------------------------
create or replace function public.log_party_encounters(p_hunt_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_owner uuid;
begin
  if p_amount is null or p_amount < 1 or p_amount > 1000000 then
    raise exception 'amount must be between 1 and 1000000';
  end if;
  if not public.shiny_hunt_can_contribute(p_hunt_id, auth.uid()) then
    raise exception 'not a member of this hunt';
  end if;
  v_owner := public.shiny_hunt_owner_id(p_hunt_id);
  update public.shiny_hunts
    set encounters = encounters + p_amount,
        updated_at = now()
    where id = p_hunt_id and status = 'active'
    returning encounters into v_total;
  if not found then
    raise exception 'hunt is not active';
  end if;
  if auth.uid() <> v_owner then
    update public.shiny_hunt_parties
      set encounters_contributed = encounters_contributed + p_amount
      where hunt_id = p_hunt_id and user_id = auth.uid() and status = 'accepted';
  end if;
  return v_total;
end;
$$;

revoke all on function public.log_party_encounters(uuid, integer) from anon, public;
grant execute on function public.log_party_encounters(uuid, integer) to authenticated;

-- Realtime for the parties table (pending invite badges update live).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'shiny_hunt_parties'
  ) then
    alter publication supabase_realtime add table shiny_hunt_parties;
  end if;
end $$;

-- Seed the co-op hunt achievement (guarded: no-op if achievements table missing).
do $$
begin
  if to_regclass('public.achievements') is not null then
    insert into achievements (id, name, description, icon, category) values
      ('party-hunt', 'Hunt Party', 'Join your first co-op shiny hunt', '👯', 'Hunts')
    on conflict (id) do nothing;
  end if;
end $$;
