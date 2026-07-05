-- =============================================================================
-- 360 Integrated — v2 patch #6
-- Run this in Supabase SQL Editor.
--
-- Adds:
--   * profiles.signature_path — optional storage path pointing at the user's
--     signature image (stored in the 'signatures' bucket). Used by:
--       - Admin: uploads on behalf of the tech when adding/editing a technician
--       - Technician: uploads themselves via /technician/profile
--       - Invoice PDF: renders the image above the "Technical Team Leader" line
--         only if the assigned tech has one
--
-- Also: create the 'signatures' storage bucket from the Supabase Dashboard
-- (Storage → New bucket → name: signatures → Public bucket: ON → Save).
-- No storage policies needed if the bucket is public.
-- =============================================================================

alter table profiles
  add column if not exists signature_path text;
