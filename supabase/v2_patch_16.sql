-- =============================================================================
-- 360 Integrated — v2 patch #16
-- Run this in Supabase SQL Editor.
--
-- Adds scheduled-visit fields to tickets so admin (and eventually technicians)
-- can pin a specific date + time when the tech is going to show up. Powers the
-- new Calendar view and the "Scheduled for …" line on the requester tracking
-- page.
--
-- RLS stays as-is: whoever can UPDATE a ticket via the existing policies
-- (admin all, tech on assigned) can also set scheduled_at.
-- =============================================================================

alter table tickets
  add column if not exists scheduled_at timestamptz,
  add column if not exists scheduled_duration_minutes int not null default 60;

create index if not exists tickets_scheduled_at_idx on tickets (scheduled_at)
  where scheduled_at is not null;
