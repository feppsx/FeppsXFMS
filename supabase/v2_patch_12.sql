-- =============================================================================
-- 360 Integrated — v2 patch #12
-- Run this in Supabase SQL Editor AFTER patch 11 has committed.
--
-- Broadens is_360_staff() to include the 'manager' role added in patch 11.
-- We can't do this in patch 11 itself because Postgres refuses to compile a
-- function that references an enum value that hasn't been committed yet.
-- =============================================================================

create or replace function is_360_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from profiles where id = auth.uid()) in ('admin','technician','manager'),
    false
  );
$$;
