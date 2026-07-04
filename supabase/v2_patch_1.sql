-- =============================================================================
-- 360 Integrated — v2 patch #1
-- Run this in Supabase SQL Editor.
--
-- Fixes:
--   1. "new row violates row-level security policy for table ticket_status_history"
--      when a requester creates a ticket. The BEFORE-INSERT trigger writes a
--      status-history row as the current user, which RLS blocks. We make the
--      trigger SECURITY DEFINER so it runs as the function owner (postgres),
--      bypassing RLS for that internal audit write.
--
--   2. 400 on image upload. Simpler storage-bucket policies that just allow
--      any authenticated user to work inside the `tickets/` folder.
-- =============================================================================

-- --- Fix 1: trigger runs as owner --------------------------------------------
alter function log_ticket_status_change() security definer;

-- --- Fix 2: simpler storage policies for the ticket-attachments bucket -------
-- Requires: the bucket 'ticket-attachments' exists (Storage -> New bucket -> off Public).

-- Drop any old policies you might have created previously (safe if none exist).
drop policy if exists "auth read"       on storage.objects;
drop policy if exists "auth insert"     on storage.objects;
drop policy if exists "owner delete"    on storage.objects;
drop policy if exists "admin all"       on storage.objects;
drop policy if exists "ticket attachments authenticated" on storage.objects;

-- One policy: any authenticated user can read/write/delete inside tickets/*
-- in the ticket-attachments bucket. RLS on our `ticket_attachments` table still
-- controls who can LINK a file to a ticket, which is the actual access gate.
create policy "ticket attachments authenticated"
  on storage.objects
  for all
  to authenticated
  using  (bucket_id = 'ticket-attachments' and (storage.foldername(name))[1] = 'tickets')
  with check (bucket_id = 'ticket-attachments' and (storage.foldername(name))[1] = 'tickets');
