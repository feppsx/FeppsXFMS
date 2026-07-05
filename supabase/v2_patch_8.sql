-- =============================================================================
-- 360 Integrated — v2 patch #8
-- Run this in Supabase SQL Editor.
--
-- Adds:
--   * invoices.is_paid  — one-click paid/unpaid toggle from admin
--   * invoices.paid_at  — timestamp when marked paid
--   * paid_by           — profile who marked it paid
--   * an index for the dashboard "tickets per day" query
--   * an index for the admin invoice list ordering
-- =============================================================================

alter table invoices
  add column if not exists is_paid  boolean not null default false,
  add column if not exists paid_at  timestamptz,
  add column if not exists paid_by  uuid references profiles(id) on delete set null;

create index if not exists invoices_is_paid_idx on invoices (is_paid, invoice_date desc);
create index if not exists tickets_created_day_idx on tickets (created_at desc);
