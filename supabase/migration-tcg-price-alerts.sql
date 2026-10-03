-- TCG Price Alerts (added Oct 2026)
--
-- Want-list price-drop alerts ("🔔 Price Alerts" in the TCG Value tab).
-- dismissed_alerts records which alert cards the user dismissed: a dismissed
-- alert stays hidden until a NEWER price snapshot arrives for that card
-- (i.e. fresh price data = potentially a new drop worth showing).
-- Also seeds the "Deal Hunter" achievement.
-- Idempotent: safe to re-run.

create table if not exists public.dismissed_alerts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id text not null,
  dismissed_at timestamptz not null default now(),
  unique (user_id, card_id)
);
comment on table public.dismissed_alerts is 'TCG price alerts: per-user dismissed deal-hunter alerts. A dismissal hides the card until a newer price snapshot arrives.';

alter table public.dismissed_alerts enable row level security;

drop policy if exists dismissed_alerts_owner_all on public.dismissed_alerts;
create policy dismissed_alerts_owner_all on public.dismissed_alerts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed the Deal Hunter achievement (guarded: no-op if achievements table missing).
do $$
begin
  if to_regclass('public.achievements') is not null then
    insert into achievements (id, name, description, icon, category) values
      ('deal-hunter', 'Deal Hunter', 'Catch a price drop on your want list', '🏷️', 'TCG')
    on conflict (id) do nothing;
  end if;
end $$;
