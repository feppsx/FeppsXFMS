-- =============================================================================
-- 360 Integrated — v2 patch #17
-- Run this in Supabase SQL Editor.
--
-- Fixes: when admin assigns a ticket to a technician, the tech's page didn't
-- update live. Root cause was two-fold:
--
--   (1) Postgres REPLICA IDENTITY on `tickets` was the default (primary key
--       only). Supabase Realtime needs REPLICA IDENTITY FULL to see BOTH the
--       old and new row images. Without both, RLS checks on UPDATE events
--       can silently drop the event for a user whose visibility just changed
--       (which is exactly what happens when assigned_to flips from NULL/other
--       to the technician themselves).
--
--   (2) Managers had SELECT on tickets but no UPDATE — they couldn't help
--       techs by moving a ticket forward. We add the same restricted UPDATE
--       policy technicians have.
--
-- Also does the same REPLICA IDENTITY FULL on the child tables that drive the
-- live timeline / attachments so their events aren't dropped either.
-- =============================================================================

-- ------ 1. Full replica identity so Realtime + RLS behave --------------------
alter table tickets                  replica identity full;
alter table ticket_status_history    replica identity full;
alter table ticket_attachments       replica identity full;
alter table ticket_comments          replica identity full;

-- ------ 2. Managers can update tickets (same rules as tech) ------------------
drop policy if exists tickets_manager_update on tickets;
create policy tickets_manager_update on tickets
  for update to authenticated
  using (auth_role() = 'manager')
  with check (
    auth_role() = 'manager'
    and status in ('assigned','in_progress','on_hold','resolved')
  );

-- ------ 3. Managers can insert attachments + comments on any ticket ---------
drop policy if exists attachments_manager_insert on ticket_attachments;
create policy attachments_manager_insert on ticket_attachments
  for insert to authenticated
  with check (
    auth_role() = 'manager'
    and uploaded_by = auth.uid()
  );

drop policy if exists comments_manager_insert on ticket_comments;
create policy comments_manager_insert on ticket_comments
  for insert to authenticated
  with check (
    auth_role() = 'manager'
    and author_id = auth.uid()
  );

-- ------ 4. Reload PostgREST schema cache so new policies apply now -----------
notify pgrst, 'reload schema';
