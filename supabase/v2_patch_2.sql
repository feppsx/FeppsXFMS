-- =============================================================================
-- 360 Integrated — v2 patch #2
-- Run this in Supabase SQL Editor.
--
-- Adds: auto-create a `profiles` row whenever a new auth user is created via
-- Authentication → Users → Add user. New profiles default to role='requester';
-- an admin can promote them later.
--
-- Also lets an admin insert profile rows via SQL (already possible) and lets
-- the trigger bypass RLS (SECURITY DEFINER).
-- =============================================================================

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Skip if a profile already exists (e.g. admin created it manually).
  if exists (select 1 from profiles where id = new.id) then
    return new;
  end if;

  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1),
      'New user'
    ),
    'requester'
  );

  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
