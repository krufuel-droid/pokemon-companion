-- Nuzlocke invites + leave-run support (Oct 2026). Safe to re-run.
--
-- Changes:
--   * New table nuzlocke_invites: inviting a trainer by name now creates a
--     PENDING invite they must accept, instead of adding them directly.
--   * nuzlocke_participants insert policy tightened to self-only: nobody can
--     add another person to a run directly (invite link joins and invite
--     accepts both insert the joiner themselves, so nothing breaks).
--   * Delete-own on participants already existed (leave-run UI uses it).

-- ----------------------------------------------------------------------------
-- nuzlocke_invites
-- ----------------------------------------------------------------------------
create table if not exists nuzlocke_invites (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references nuzlockes(id) on delete cascade,
  inviter_id uuid not null references profiles(id) on delete cascade,
  invitee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  check (inviter_id <> invitee_id)
);
comment on table nuzlocke_invites is 'Pending/answered invites to join a Nuzlocke run. Accepting adds the invitee as a participant.';

-- One pending invite per trainer per run (re-invites allowed after decline).
drop index if exists idx_nuzlocke_invites_pending_unique;
create unique index idx_nuzlocke_invites_pending_unique
  on nuzlocke_invites (run_id, invitee_id)
  where status = 'pending';

create index if not exists idx_nuzlocke_invites_invitee on nuzlocke_invites (invitee_id);
create index if not exists idx_nuzlocke_invites_run on nuzlocke_invites (run_id);

alter table nuzlocke_invites enable row level security;

-- Invitees see their own invites; run participants see invites for their run.
drop policy if exists nuzlocke_invites_select on nuzlocke_invites;
create policy nuzlocke_invites_select on nuzlocke_invites
  for select using (
    auth.uid() = invitee_id
    or auth.uid() = inviter_id
    or public.is_run_participant(nuzlocke_invites.run_id, auth.uid())
  );

-- Any run participant can invite (creates a pending request, not a join).
drop policy if exists nuzlocke_invites_insert on nuzlocke_invites;
create policy nuzlocke_invites_insert on nuzlocke_invites
  for insert with check (
    auth.uid() = inviter_id
    and public.is_run_participant(nuzlocke_invites.run_id, auth.uid())
  );

-- The invitee answers their own invite (accept/decline).
drop policy if exists nuzlocke_invites_update_own on nuzlocke_invites;
create policy nuzlocke_invites_update_own on nuzlocke_invites
  for update using (auth.uid() = invitee_id)
  with check (auth.uid() = invitee_id);

-- The inviter can rescind a pending invite.
drop policy if exists nuzlocke_invites_delete_own on nuzlocke_invites;
create policy nuzlocke_invites_delete_own on nuzlocke_invites
  for delete using (auth.uid() = inviter_id and status = 'pending');

-- ----------------------------------------------------------------------------
-- Tighten participant inserts: self-only. Nobody can add another person.
-- (Invite-link joins and invite accepts insert the joiner themselves.)
-- ----------------------------------------------------------------------------
drop policy if exists nuzlocke_participants_insert_own on nuzlocke_participants;
create policy nuzlocke_participants_insert_self on nuzlocke_participants
  for insert with check (auth.uid() = user_id);

-- Realtime for the invites table (pending invite badges update live).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'nuzlocke_invites'
  ) then
    alter publication supabase_realtime add table nuzlocke_invites;
  end if;
end $$;
