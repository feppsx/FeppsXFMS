-- =============================================================================
-- 360 Integrated — v2 patch #11
-- Run this in Supabase SQL Editor.
--
-- Phase 1 of the "Estate" refactor + manager role + manual invoice foundation.
--
-- We keep the underlying table name `clients` to avoid rewriting every RLS
-- policy and FK. In the UI + TypeScript we now call them "Estates".
--
-- Additions:
--   * estate_category enum (Retail / MCST / SBS)
--   * clients.category — defaults to 'MCST', so every existing row migrates
--   * user_role gains 'manager'
--   * invoices.client_id and invoices.category — for manual invoices that
--     aren't tied to a ticket
--   * invoices.ticket_id becomes nullable (manual invoices don't have one)
--   * is_360_staff() now includes 'manager' so managers get the same read
--     access on ticket-related history/attachments/comments as technicians
-- =============================================================================

-- 1. Estate category enum -----------------------------------------------------
create type estate_category as enum ('Retail', 'MCST', 'SBS');

-- 2. clients.category (default MCST — all existing rows inherit it) -----------
alter table clients
  add column if not exists category estate_category not null default 'MCST';

-- 3. Manager role -------------------------------------------------------------
alter type user_role add value if not exists 'manager';

-- 4. Manual-invoice support: invoices gains client_id + category,
--    and ticket_id becomes optional.
alter table invoices
  add column if not exists client_id uuid references clients(id) on delete set null,
  add column if not exists category  estate_category;

alter table invoices alter column ticket_id drop not null;

-- Was unique per ticket. Keep unique on non-null ticket_id (partial unique) so
-- a ticket still can't have two invoices, but manual invoices (ticket_id null)
-- can coexist freely.
alter table invoices drop constraint if exists invoices_ticket_id_key;
create unique index if not exists invoices_ticket_id_uniq
  on invoices (ticket_id) where ticket_id is not null;

-- NOTE: broadening is_360_staff() to include 'manager' happens in patch 12,
-- because Postgres won't let the same transaction add an enum value AND use
-- it in a function body.
