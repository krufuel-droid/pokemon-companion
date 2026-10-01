-- ============================================================================
-- Pokémon Companion — feedback table
-- ----------------------------------------------------------------------------
-- HOW TO RUN THIS (for the app owner, no coding needed):
--   1. Open your Supabase project at https://supabase.com/dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this whole file, and click "Run"
--   4. Done. It's safe to run this file more than once — every statement is
--      guarded so re-running won't create duplicates or throw errors.
--
-- After running, open the /feedback page on your site and send a test
-- message. It should appear in the dashboard under "Table Editor" → the
-- "feedback" table. That's also where you read every submission.
--
-- Requires: pgcrypto extension (standard on Supabase) for gen_random_uuid().
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- feedback
-- User-submitted feedback: bug reports, feature ideas, and hellos.
-- trainer_name and user_id are optional so logged-out visitors can write in.
-- ----------------------------------------------------------------------------
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('bug', 'idea', 'hello')),
  message text not null check (char_length(message) between 1 and 2000),
  trainer_name text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table feedback is 'User feedback: bug reports, feature ideas, and hellos.';

alter table feedback enable row level security;

-- Anyone (signed in or not) may SUBMIT feedback. There is deliberately no
-- public SELECT policy: submissions are private and are read by the owner
-- in the Supabase dashboard's Table Editor.
drop policy if exists feedback_insert_anyone on feedback;
create policy feedback_insert_anyone on feedback
  for insert with check (true);
