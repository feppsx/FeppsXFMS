-- =============================================================================
-- 360 Integrated — v2 patch #19
-- Adds an optional `unit_number` field to tickets so requesters can capture
-- e.g. "#06-11, Blk 71-A" separately from the free-text "specific_area".
-- =============================================================================

alter table tickets
  add column if not exists unit_number text;

notify pgrst, 'reload schema';
