-- Streak milestones (Oct 2026). Safe to re-run.
--
-- Seeds the catch-streak achievements. No new table needed: streaks are
-- computed from daily_catches.potd_date in lib/streaks.ts.
--
-- WHY THIS EXISTS: user_achievements.achievement_id has a foreign key to
-- achievements(id), so evaluateStreakMilestones() cannot unlock 'streak-7'
-- / 'streak-30' until these rows exist.
--
-- HOW TO RUN THIS (for the app owner, no coding needed):
--   1. Open your Supabase project at https://supabase.com/dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this whole file, and click "Run"

insert into achievements (id, name, description, icon, category) values
  ('streak-7', 'Week Warrior', 'Log a Pokémon-of-the-Day catch 7 days in a row', '🔥', 'Daily'),
  ('streak-30', 'Unstoppable', 'Log a Pokémon-of-the-Day catch 30 days in a row', '🌋', 'Daily')
on conflict (id) do nothing;
