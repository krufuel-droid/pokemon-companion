-- Soul Link pairing for Nuzlocke runs. Safe to re-run.
-- Adds a bidirectional link between two team rows (one per player). When one
-- linked Pokémon dies, its partner dies too via soul_link_cascade().

alter table nuzlocke_team
  add column if not exists linked_to uuid references nuzlocke_team(id) on delete set null;

-- Pair two Pokémon as soul-linked. SECURITY DEFINER because RLS only lets a
-- user update their own rows, but a link touches both players' rows.
create or replace function soul_link_pair(p_mine uuid, p_partner uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  r_mine record;
  r_partner record;
begin
  if v_me is null then raise exception 'Not authenticated'; end if;
  if p_mine = p_partner then raise exception 'Cannot link a Pokémon to itself'; end if;

  select * into r_mine from nuzlocke_team where id = p_mine;
  select * into r_partner from nuzlocke_team where id = p_partner;
  if r_mine.id is null or r_partner.id is null then raise exception 'Pokémon not found'; end if;
  if r_mine.user_id != v_me then raise exception 'You can only link your own Pokémon'; end if;
  if r_mine.run_id != r_partner.run_id then raise exception 'Both Pokémon must be in the same run'; end if;
  if r_mine.user_id = r_partner.user_id then raise exception 'Soul links must be with another player''s Pokémon'; end if;
  if r_mine.status != 'alive' or r_partner.status != 'alive' then raise exception 'Only living Pokémon can be linked'; end if;

  -- Clear any previous links on either side (both directions).
  update nuzlocke_team set linked_to = null where id = r_mine.linked_to;
  update nuzlocke_team set linked_to = null where id = r_partner.linked_to;
  update nuzlocke_team set linked_to = null where linked_to = p_mine;
  update nuzlocke_team set linked_to = null where linked_to = p_partner;

  -- Set the bidirectional link.
  update nuzlocke_team set linked_to = p_partner, updated_at = now() where id = p_mine;
  update nuzlocke_team set linked_to = p_mine, updated_at = now() where id = p_partner;
end;
$$;

-- Remove a soul link (either side can break it).
create or replace function soul_link_unpair(p_mine uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_partner uuid;
begin
  if v_me is null then raise exception 'Not authenticated'; end if;
  select linked_to into v_partner from nuzlocke_team where id = p_mine and user_id = v_me;
  if v_partner is null then return; end if;
  update nuzlocke_team set linked_to = null, updated_at = now() where id = p_mine;
  update nuzlocke_team set linked_to = null, updated_at = now() where id = v_partner;
end;
$$;

-- When a linked Pokémon dies, its partner dies too (with a memorial).
-- Called right after the owner's own death update.
create or replace function soul_link_cascade(p_dead_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner uuid;
  v_partner_user uuid;
  v_partner_species text;
  v_partner_nickname text;
  v_mine_nickname text;
  v_mine_species text;
begin
  select linked_to into v_partner from nuzlocke_team where id = p_dead_id;
  if v_partner is null then return null; end if;

  select user_id, species_name, nickname into v_partner_user, v_partner_species, v_partner_nickname
    from nuzlocke_team where id = v_partner;
  select species_name, nickname into v_mine_species, v_mine_nickname
    from nuzlocke_team where id = p_dead_id;

  -- The partner falls too.
  update nuzlocke_team
    set status = 'dead', linked_to = null, updated_at = now()
    where id = v_partner and status = 'alive';
  update nuzlocke_team set linked_to = null where id = p_dead_id;

  -- Memorial for the partner, owned by the partner's trainer.
  if v_partner_user is not null then
    insert into memorials (owner_id, species_name, nickname, note)
    values (
      v_partner_user,
      v_partner_species,
      v_partner_nickname,
      'Soul-linked with ' || coalesce(v_mine_nickname, v_mine_species) || ' — they fell together.'
    );
  end if;

  return coalesce(v_partner_nickname, v_partner_species);
end;
$$;
