-- Master achievement catalog seed.
-- The achievements table is the source of truth for the /achievements gallery,
-- and user_achievements.achievement_id is a foreign key into it — so every
-- achievement id the app can unlock MUST have a row here, or unlocks fail
-- silently and the gallery can't render names/icons.
-- This covers the full catalog as of Oct 3, 2026 (22 original + 17 new).
-- Idempotent: safe to re-run (on conflict do nothing).
--
-- NOTE: seasonal achievements are year-scoped (e.g. spooky-week-catch-2027).
-- When a new year rolls around, add seed rows for that year's seasonal ids.

insert into achievements (id, name, description, icon, category) values
  -- Original 22
  ('first-favorite', 'First Favorite', 'Favorite your first Pokémon', '⭐', 'Collection'),
  ('favorite-10', 'Growing Collection', 'Favorite 10 Pokémon', '⭐', 'Collection'),
  ('favorite-50', 'Serious Collector', 'Favorite 50 Pokémon', '🏅', 'Collection'),
  ('favorite-100', 'Living Dex Dream', 'Favorite 100 Pokémon', '💯', 'Collection'),
  ('first-hunt', 'Shiny Hunter', 'Start your first shiny hunt', '✨', 'Shiny'),
  ('hunt-100', 'Persistent', 'Reach 100 encounters on one hunt', '🔁', 'Shiny'),
  ('first-shiny', 'Golden!', 'Complete a shiny hunt', '🌟', 'Shiny'),
  ('shiny-5', 'Shiny Squad', 'Complete 5 shiny hunts', '🌈', 'Shiny'),
  ('first-nuzlocke', 'Brave Soul', 'Start your first Nuzlocke run', '💀', 'Nuzlocke'),
  ('first-death', 'First Blood', 'Lose your first Pokémon (RIP)', '🪦', 'Nuzlocke'),
  ('nuzlocke-complete', 'Survivor', 'Complete a Nuzlocke run', '🏆', 'Nuzlocke'),
  ('memorial-10', 'Fallen Heroes', 'Memorialize 10 fallen Pokémon', '🕯️', 'Nuzlocke'),
  ('soul-link', 'Together Strong', 'Join a friend''s Nuzlocke run', '🤝', 'Nuzlocke'),
  ('first-post', 'Hello World', 'Make your first community post', '💬', 'Social'),
  ('posts-10', 'Chatterbox', 'Make 10 community posts', '📣', 'Social'),
  ('first-friend', 'Friendly', 'Add your first friend', '👋', 'Social'),
  ('friends-10', 'Popular', 'Have 10 friends', '🎉', 'Social'),
  ('reactions-25', 'Cheerleader', 'React to 25 posts', '❤️', 'Social'),
  ('quiz-rookie', 'Who''s That?', 'Answer a quiz question correctly', '❓', 'Fun'),
  ('quiz-streak-10', 'Poké Scholar', 'Get a 10-answer streak in Who''s That Pokémon?', '🎓', 'Fun'),
  ('daily-first', 'Daily Catch', 'Log a Pokémon of the Day catch', '📅', 'Daily'),
  ('daily-5', 'Daily Devotee', 'Log 5 Pokémon of the Day catches', '🌟', 'Daily'),
  -- Shiny hunt upgrades (Oct 3, 2026)
  ('hunt-1000', 'Dedicated', 'Reach 1,000 encounters on a single shiny hunt', '💪', 'Shiny'),
  ('shiny-phase-5', 'Tough Luck Charm', 'Reach 5 phases on a single shiny hunt', '🍀', 'Shiny'),
  ('shiny-10', 'Sparkle Decade', 'Complete 10 shiny hunts', '💎', 'Shiny'),
  -- Trading board (Oct 3, 2026)
  ('first-trade-post', 'Open for Business', 'Create your first community trade post', '🤝', 'Trading'),
  ('trade-fulfilled', 'Deal Closed', 'Mark a trade post fulfilled', '📦', 'Trading'),
  -- Daily/weekly challenges (Oct 3, 2026)
  ('streak-7', 'Week Warrior', 'Log a Pokémon-of-the-Day catch 7 days in a row', '🔥', 'Daily'),
  ('streak-30', 'Unstoppable', 'Log a Pokémon-of-the-Day catch 30 days in a row', '🌋', 'Daily'),
  -- Rivals (Oct 3, 2026)
  ('first-rival', 'Friendly Fire', 'Declare your first rival', '⚔️', 'Rivals'),
  ('rival-victory', 'Top of the Food Chain', 'Win a weekly rivalry', '🏆', 'Rivals'),
  -- Badge case (Oct 3, 2026)
  ('badge-1', 'Gym Challenger', 'Earn your first gym badge', '🏵️', 'Badges'),
  ('badge-5', 'Badge Collector', 'Earn 5 gym badges', '🎖️', 'Badges'),
  ('badge-10', 'Gym Leader Material', 'Earn all 10 gym badges', '👑', 'Badges'),
  -- Living Dex race (Oct 3, 2026)
  ('dex-race-leader', 'Dex Sprinter', 'Top the friends Living Dex race leaderboard for a week', '🏁', 'Collection'),
  -- Seasonal events: Spooky Week (year-scoped ids)
  ('spooky-week-catch-2026', 'Ghostly Greetings', 'Log a Pokémon of the Day catch during Spooky Week', '👻', 'Seasonal'),
  ('spooky-week-catch-5-2026', 'Graveyard Shift', 'Log 5 Pokémon of the Day catches during Spooky Week', '🪦', 'Seasonal'),
  ('spooky-week-catch-2027', 'Ghostly Greetings', 'Log a Pokémon of the Day catch during Spooky Week', '👻', 'Seasonal'),
  ('spooky-week-catch-5-2027', 'Graveyard Shift', 'Log 5 Pokémon of the Day catches during Spooky Week', '🪦', 'Seasonal')
on conflict (id) do nothing;
