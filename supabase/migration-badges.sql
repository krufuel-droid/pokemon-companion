-- Gym badge case support (added Oct 2026)
--
-- Badges themselves are derived live from existing tables (no user_badges
-- table needed). This migration only seeds the badge-achievement
-- definitions into the `achievements` catalog, because
-- user_achievements.achievement_id is a foreign key: unlocking a badge
-- achievement fails unless its definition row exists.
-- Safe to re-run.

insert into achievements (id, name, description, icon, category)
values
  ('badge-1', 'Gym Challenger', 'Earn your first gym badge', '🏵️', 'Badges'),
  ('badge-5', 'Badge Collector', 'Earn 5 gym badges', '🎖️', 'Badges'),
  ('badge-10', 'Gym Leader Material', 'Earn all 10 gym badges', '👑', 'Badges')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  category = excluded.category;
