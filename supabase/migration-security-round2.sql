-- Security round 2 (Oct 2026): closes the remaining hardening gaps found in the
-- private-profile RLS audit. Idempotent: safe to re-run. Amanda runs this in
-- the Supabase SQL Editor.
--
-- Included:
--   S1  Friendship forgery: only the requester can create a request row.
--   S2  friendship_progress: friends can READ either direction, but only WRITE
--       their own directional row.
--   S3  DM read receipts: receivers can only flip read_at, not rewrite bodies.
--   S4  Nuzlocke owner kick: run owners can remove crashers from their run.
--   S6  Memorial wall: run-mates can read each other's memorials (the shared
--       memorial wall queries all participants' memorials).
--
-- NOT included (needs Amanda's product call):
--   S5  nuzlocke_team SELECT is open (using(true)). Runs are public anyway,
--       so public teams may be intended — left as-is.
--   Invite-link joins need no invite code (anyone with the run id can join).
--       The owner-kick policy below is the safety net; leave open or tighten
--       per Amanda's call.

-- ----------------------------------------------------------------------------
-- S1: friendship forgery — A could insert (B → A) then accept it, so B never
-- consented. Now only the requester can create the row.
-- ----------------------------------------------------------------------------
drop policy if exists friendships_insert_participants on friendships;
create policy friendships_insert_participants on friendships
  for insert with check (auth.uid() = requester_id);

-- ----------------------------------------------------------------------------
-- S2: friendship_progress cross-writes — B could zero/inflate A's directional
-- row. Split into read-either + write-own.
-- ----------------------------------------------------------------------------
drop policy if exists friendship_progress_parties on friendship_progress;
create policy friendship_progress_select_either on friendship_progress
  for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy friendship_progress_write_own on friendship_progress
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- S3: DM read receipts — the receiver's UPDATE was unrestricted, so they could
-- rewrite message bodies. RLS can't see OLD values, so a trigger enforces it:
-- only read_at may change.
-- ----------------------------------------------------------------------------
create or replace function public.messages_read_receipt_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.sender_id is distinct from old.sender_id
     or new.receiver_id is distinct from old.receiver_id
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'Receivers may only update the read receipt (read_at).';
  end if;
  return new;
end; $$;
drop trigger if exists messages_read_receipt_only on public.messages;
create trigger messages_read_receipt_only before update on public.messages
  for each row execute function public.messages_read_receipt_only();

-- ----------------------------------------------------------------------------
-- S4: nuzlocke owner kick — run owners can remove participants (crashers).
-- Participants can still leave on their own (existing delete-own policy).
-- ----------------------------------------------------------------------------
drop policy if exists nuzlocke_participants_delete_owner_kick on nuzlocke_participants;
create policy nuzlocke_participants_delete_owner_kick on nuzlocke_participants
  for delete using (
    exists (
      select 1 from nuzlockes n
      where n.id = nuzlocke_participants.run_id
        and n.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- S6: memorial wall — the run page shows every participant's memorials, but
-- RLS was owner-only, so the wall silently showed only your own. Run-mates
-- can now read each other's memorials.
-- ----------------------------------------------------------------------------
drop policy if exists memorials_select_runmates on memorials;
create policy memorials_select_runmates on memorials
  for select using (
    exists (
      select 1
      from nuzlocke_participants mine
      join nuzlocke_participants theirs on theirs.run_id = mine.run_id
      where mine.user_id = auth.uid()
        and theirs.user_id = memorials.owner_id
    )
  );
