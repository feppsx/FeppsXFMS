-- =============================================================================
-- 360 Integrated — v2 patch #7
-- Run this in Supabase SQL Editor.
--
-- Adds storage-object policy so authenticated users can UPLOAD to the
-- 'signatures' bucket. "Public bucket" only means public READ; writes still
-- need an explicit policy.
-- =============================================================================

drop policy if exists "signatures authenticated write" on storage.objects;

create policy "signatures authenticated write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'signatures')
  with check (bucket_id = 'signatures');
