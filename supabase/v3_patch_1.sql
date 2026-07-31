-- =============================================================================
-- FeppsXFMS — v3 patch #1
-- Fixes: "null value in column organization_id of relation profiles violates
-- not-null constraint" whenever a new auth user is created via the Supabase
-- dashboard or Invite flow.
--
-- Root cause: patch 2 added a trigger that auto-inserts a profiles row on
-- every new auth.users insert. v3 made organization_id NOT NULL, so the
-- insert fails.
--
-- Fix: only auto-create a profiles row when the caller passes organization_id
-- (and optionally role) via raw_user_meta_data. If no org is specified, do
-- nothing — the caller (e.g. platform admin creation, invite flow) will
-- handle profile/platform_admin row creation explicitly.
-- =============================================================================

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_org_id  uuid;
  meta_role    text;
  meta_name    text;
begin
  -- Skip if a profile already exists.
  if exists (select 1 from profiles where id = new.id) then
    return new;
  end if;

  -- Read org / role / name from user metadata (invite flow will set these).
  meta_org_id := nullif(new.raw_user_meta_data->>'organization_id', '')::uuid;
  meta_role   := nullif(new.raw_user_meta_data->>'role', '');
  meta_name   := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    split_part(new.email, '@', 1),
    'New user'
  );

  -- No org supplied -> assume this is a platform admin or an out-of-band
  -- admin insert. Do NOT create a profile row; caller will handle it.
  if meta_org_id is null then
    return new;
  end if;

  insert into profiles (id, full_name, role, organization_id)
  values (
    new.id,
    meta_name,
    coalesce(meta_role::user_role, 'requester'::user_role),
    meta_org_id
  );

  return new;
end;
$$;

-- Trigger stays as-is; only the function body changed.
notify pgrst, 'reload schema';
