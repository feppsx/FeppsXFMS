-- =============================================================================
-- 360 Integrated — v2 patch #9
-- Run in Supabase SQL Editor.
--
-- Adds a `color` column to ticket_categories so admins can pick a hue for
-- each category. The chosen color drives colored pills on ticket rows,
-- detail pages, and eventually filter chips.
--
-- Existing categories get sensible default colors based on their name.
-- =============================================================================

alter table ticket_categories
  add column if not exists color text not null default '#64748b';   -- slate-500

-- Seed defaults for the pre-populated categories from v2.sql
update ticket_categories set color = '#f59e0b' where name = 'Electrical'      and color = '#64748b';
update ticket_categories set color = '#3b82f6' where name = 'Plumbing'        and color = '#64748b';
update ticket_categories set color = '#06b6d4' where name = 'HVAC / Aircon'   and color = '#64748b';
update ticket_categories set color = '#a855f7' where name = 'Lift / Elevator' and color = '#64748b';
update ticket_categories set color = '#10b981' where name = 'Cleaning'        and color = '#64748b';
update ticket_categories set color = '#ef4444' where name = 'Security'        and color = '#64748b';
update ticket_categories set color = '#f97316' where name = 'Carpentry'       and color = '#64748b';
update ticket_categories set color = '#84cc16' where name = 'Pest Control'    and color = '#64748b';
