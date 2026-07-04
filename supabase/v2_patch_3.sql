-- =============================================================================
-- 360 Integrated — v2 patch #3
-- Run this in Supabase SQL Editor.
--
-- Adds:
--   * technician_trades — many-to-many between technicians (profiles.role='technician')
--     and ticket_categories. One tech can cover Electrical + General, another
--     covers only Plumbing, etc.
--   * RLS: any signed-in user can READ trades (needed for the assign dropdown
--     to show which tech does what). Admin writes only.
-- =============================================================================

create table if not exists technician_trades (
  technician_id  uuid not null references profiles(id) on delete cascade,
  category_id    uuid not null references ticket_categories(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (technician_id, category_id)
);
create index if not exists technician_trades_tech_idx on technician_trades (technician_id);
create index if not exists technician_trades_cat_idx  on technician_trades (category_id);

alter table technician_trades enable row level security;

-- Drop-then-create so re-running the patch is safe.
drop policy if exists trades_read_all      on technician_trades;
drop policy if exists trades_admin_write   on technician_trades;

create policy trades_read_all on technician_trades
  for select to authenticated using (true);

create policy trades_admin_write on technician_trades
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

-- Broadcast changes so the admin UI updates live when trades are edited.
alter publication supabase_realtime add table technician_trades;
