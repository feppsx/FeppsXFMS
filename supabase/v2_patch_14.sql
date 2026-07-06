-- =============================================================================
-- 360 Integrated — v2 patch #14
-- Run this in Supabase SQL Editor.
--
-- Manual invoices don't have a parent ticket, so they can't hang their photos
-- off ticket_attachments. Add two path-array columns directly on invoices so
-- manual generation can persist Before/After photos independently.
-- =============================================================================

alter table invoices
  add column if not exists before_photo_paths text[] not null default '{}',
  add column if not exists after_photo_paths  text[] not null default '{}';

comment on column invoices.before_photo_paths is
  'Storage paths (bucket: ticket-attachments) for Before photos on manual invoices.';
comment on column invoices.after_photo_paths is
  'Storage paths (bucket: ticket-attachments) for After photos on manual invoices.';
