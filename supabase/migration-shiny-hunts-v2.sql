-- Shiny hunts v2: phase counting + new shiny achievements.
-- Idempotent: safe to re-run. Amanda runs this in the Supabase SQL Editor.

-- Phase counting for long hunts. A "phase" starts at 1; the "New phase"
-- button increments it while the encounters total keeps running.
alter table shiny_hunts
  add column if not exists phases integer not null default 1;

comment on column shiny_hunts.phases is
  'Phase counter for long hunts: incremented via "New phase", encounters keep accumulating.';

-- Seed the v2 shiny achievements (matching lib/achievements-shiny.ts).
-- Safe to re-run: on conflict (id) do nothing.
insert into achievements (id, name, description, icon, category) values
  ('hunt-1000', 'Dedicated', 'Reach 1,000 encounters on a single shiny hunt', '💪', 'Shiny'),
  ('shiny-phase-5', 'Tough Luck Charm', 'Reach 5 phases on a single shiny hunt', '🍀', 'Shiny'),
  ('shiny-10', 'Sparkle Decade', 'Complete 10 shiny hunts', '💎', 'Shiny')
on conflict (id) do nothing;
