-- =============================================================================
-- FeppsXFMS — v3 patch #5
-- Consent-based impersonation + platform audit log.
--
--   1. organizations.require_impersonation_consent  -- per-org toggle, default off
--   2. impersonation_requests                       -- pending/approved/denied requests
--   3. platform_audit_log                           -- every platform_admin action
-- =============================================================================

-- --- 1. Per-org toggle -----------------------------------------------------
alter table organizations
  add column if not exists require_impersonation_consent boolean not null default false;

-- --- 2. Impersonation request queue ---------------------------------------
create table if not exists impersonation_requests (
  id                uuid primary key default gen_random_uuid(),
  target_user_id    uuid not null references auth.users(id) on delete cascade,
  target_org_id     uuid not null references organizations(id) on delete cascade,
  requested_by      uuid not null references auth.users(id) on delete cascade,
  reason            text not null,
  status            text not null default 'pending'
                    check (status in ('pending','approved','denied','expired','consumed')),
  expires_at        timestamptz not null default (now() + interval '15 minutes'),
  decided_at        timestamptz,
  consumed_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists impersonation_requests_target_idx on impersonation_requests (target_user_id, status);
create index if not exists impersonation_requests_requester_idx on impersonation_requests (requested_by, status);

alter table impersonation_requests enable row level security;

-- Platform admins can do anything.
drop policy if exists impersonation_platform_all on impersonation_requests;
create policy impersonation_platform_all on impersonation_requests
  for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- The target user can see + respond to requests aimed at themselves.
drop policy if exists impersonation_target_read on impersonation_requests;
create policy impersonation_target_read on impersonation_requests
  for select to authenticated
  using (target_user_id = auth.uid());

drop policy if exists impersonation_target_update on impersonation_requests;
create policy impersonation_target_update on impersonation_requests
  for update to authenticated
  using (target_user_id = auth.uid())
  with check (target_user_id = auth.uid());

-- --- 3. Audit log ----------------------------------------------------------
create table if not exists platform_audit_log (
  id             uuid primary key default gen_random_uuid(),
  actor_id       uuid references auth.users(id) on delete set null,
  actor_email    text,
  action         text not null,
  target_org_id  uuid references organizations(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  reason         text,
  meta           jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists platform_audit_log_created_idx on platform_audit_log (created_at desc);
create index if not exists platform_audit_log_actor_idx   on platform_audit_log (actor_id);
create index if not exists platform_audit_log_target_org_idx on platform_audit_log (target_org_id);

alter table platform_audit_log enable row level security;

-- Only platform admins read the audit log. No one else (not even the org
-- being audited — showing an org admin a "we impersonated you" log is a
-- Phase-8 feature).
drop policy if exists platform_audit_log_read on platform_audit_log;
create policy platform_audit_log_read on platform_audit_log
  for select to authenticated
  using (is_platform_admin());

-- Writes only via service_role in server actions; no client-side insert path.
drop policy if exists platform_audit_log_insert on platform_audit_log;
create policy platform_audit_log_insert on platform_audit_log
  for insert to authenticated
  with check (is_platform_admin());

-- --- Realtime for impersonation_requests (so the target user's page can
--     receive the pending request instantly if they're online) --------------
alter publication supabase_realtime add table impersonation_requests;

notify pgrst, 'reload schema';
