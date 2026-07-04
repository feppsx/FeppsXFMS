-- =============================================================================
-- 360 Integrated — enable Supabase Realtime for the tables our UI subscribes to.
-- Run this AFTER 03_seed.sql (or any time — it's additive).
--
-- Supabase creates a publication called `supabase_realtime` that broadcasts
-- INSERT/UPDATE/DELETE events over websockets to any client subscribed via
-- the JS SDK. We add our ticket tables to that publication.
-- =============================================================================

alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table ticket_status_history;
alter publication supabase_realtime add table ticket_attachments;
alter publication supabase_realtime add table ticket_comments;

-- Sanity: list what's in the publication now.
-- select schemaname, tablename from pg_publication_tables
--   where pubname = 'supabase_realtime' order by tablename;
