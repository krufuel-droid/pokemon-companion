-- TCG Collection Value Dashboard (added Oct 2026)
--
-- No new tables are needed: the Value tab reads the existing
-- tcg_collection, tcg_master_set, and tcg_price_snapshots tables, and prices
-- cards live via the TCGdex API. This migration only seeds the "High Roller"
-- achievement. Idempotent: safe to re-run.

-- Seed the High Roller achievement (guarded: no-op if achievements table missing).
do $$
begin
  if to_regclass('public.achievements') is not null then
    insert into achievements (id, name, description, icon, category) values
      ('high-roller', 'High Roller', 'Your TCG collection passes $100 in market value', '💎', 'TCG')
    on conflict (id) do nothing;
  end if;
end $$;
