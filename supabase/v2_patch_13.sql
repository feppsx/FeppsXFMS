-- =============================================================================
-- 360 Integrated — v2 patch #13
-- Run this in Supabase SQL Editor.
--
-- Backfills existing ticket-based invoices with the estate's client_id and
-- category, so the /admin/invoices filters and sub-menus work uniformly.
-- Idempotent: only touches invoices where the columns are still null.
-- =============================================================================

update invoices i
   set client_id = t.client_id,
       category  = c.category
  from tickets t
  join clients c on c.id = t.client_id
 where i.ticket_id = t.id
   and (i.client_id is null or i.category is null);
