-- =============================================================================
-- FeppsXFMS  |  v3 migration — turn the app multi-tenant
--
-- Converts the single-tenant "360 Integrated" schema into a multi-tenant SaaS:
--   * NEW: organizations, platform_admins, invitations
--   * ADD organization_id to every tenant-owned table
--   * Seed default org "360 Integrated" and backfill every existing row to it
--   * Rename role 'admin' -> 'org_admin'
--   * Rewrite helper functions + every RLS policy to be org-aware
--   * Platform admins get read/write across all orgs
--
-- Safe to run ONCE on the current v2 + patches 1-25 database.
-- Run in Supabase SQL Editor. Expect "Success. No rows returned."
-- =============================================================================

-- ============================================================================
-- SECTION 1  |  NEW TABLES
-- ============================================================================

-- 1a. organizations -----------------------------------------------------------
create table if not exists organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           citext not null unique,          -- URL-safe, unique across the platform
  plan           text not null default 'free',    -- 'free' | 'pro' | 'enterprise' (billing later)
  is_active      boolean not null default true,   -- master on/off for the org
  is_suspended   boolean not null default false,  -- payment failure etc.
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists organizations_active_idx on organizations (is_active, is_suspended);

-- 1b. platform_admins ---------------------------------------------------------
-- Kept in a SEPARATE table (not in profiles). Platform admins are FeppsXFMS
-- staff, not tenants. They can act across every org.
create table if not exists platform_admins (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        citext not null unique,
  full_name    text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- 1c. invitations -------------------------------------------------------------
-- Both platform_admin (inviting the first org_admin of a new customer) and
-- org_admin (inviting their team) write here. The /invite/[token] page reads
-- it via service_role to validate before creating the auth user.
create table if not exists invitations (
  id                uuid primary key default gen_random_uuid(),
  token             text not null unique,             -- random URL-safe string
  email             citext not null,
  organization_id   uuid not null references organizations(id) on delete cascade,
  role              user_role not null,               -- 'org_admin' | 'manager' | 'technician' | 'requester'
  invited_by        uuid references auth.users(id) on delete set null,
  expires_at        timestamptz not null,
  used_at           timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists invitations_org_idx  on invitations (organization_id);
create index if not exists invitations_email_idx on invitations (email);

-- ============================================================================
-- SECTION 2  |  ADD organization_id COLUMNS (nullable, initially)
-- ============================================================================
-- Denormalized: every tenant-owned row carries its org_id directly. Makes RLS
-- one-liner instead of a subquery through the parent table.

alter table profiles              add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table clients               add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table client_tenants        add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table ticket_categories     add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table technician_trades     add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table tickets               add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table ticket_status_history add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table ticket_attachments    add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table ticket_comments       add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table ticket_feedback       add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table quotations            add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table quotation_items       add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table service_reports       add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table invoices              add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table invoice_items         add column if not exists organization_id uuid references organizations(id) on delete cascade;
alter table company_settings      add column if not exists organization_id uuid references organizations(id) on delete cascade;

-- ============================================================================
-- SECTION 3  |  SEED DEFAULT ORG + BACKFILL
-- ============================================================================
-- Fixed UUID for the default org so we can reference it deterministically.
-- If somehow already inserted, do nothing.
insert into organizations (id, name, slug, plan, is_active)
values ('00000000-0000-0000-0000-000000000360', '360 Integrated', '360-integrated', 'enterprise', true)
on conflict (id) do nothing;

-- Backfill every existing row to the default org.
update profiles              set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update clients               set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update client_tenants        set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update ticket_categories     set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update technician_trades     set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update tickets               set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update ticket_status_history set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update ticket_attachments    set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update ticket_comments       set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update ticket_feedback       set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update quotations            set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update quotation_items       set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update service_reports       set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update invoices              set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update invoice_items         set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;
update company_settings      set organization_id = '00000000-0000-0000-0000-000000000360' where organization_id is null;

-- ============================================================================
-- SECTION 4  |  MAKE organization_id NOT NULL + drop singleton constraint
-- ============================================================================
alter table profiles              alter column organization_id set not null;
alter table clients               alter column organization_id set not null;
alter table client_tenants        alter column organization_id set not null;
alter table ticket_categories     alter column organization_id set not null;
alter table technician_trades     alter column organization_id set not null;
alter table tickets               alter column organization_id set not null;
alter table ticket_status_history alter column organization_id set not null;
alter table ticket_attachments    alter column organization_id set not null;
alter table ticket_comments       alter column organization_id set not null;
alter table ticket_feedback       alter column organization_id set not null;
alter table quotations            alter column organization_id set not null;
alter table quotation_items       alter column organization_id set not null;
alter table service_reports       alter column organization_id set not null;
alter table invoices              alter column organization_id set not null;
alter table invoice_items         alter column organization_id set not null;
alter table company_settings      alter column organization_id set not null;

-- company_settings is now per-org. Drop the single-row lock, add unique(org_id).
alter table company_settings drop constraint if exists company_settings_singleton;
alter table company_settings drop constraint if exists company_settings_singleton_lock_key;
alter table company_settings drop column if exists singleton_lock;
alter table company_settings add constraint company_settings_org_uk unique (organization_id);

-- Indexes on the org_id columns for fast tenant filtering.
create index if not exists profiles_org_idx              on profiles              (organization_id);
create index if not exists clients_org_idx               on clients               (organization_id);
create index if not exists client_tenants_org_idx        on client_tenants        (organization_id);
create index if not exists ticket_categories_org_idx     on ticket_categories     (organization_id);
create index if not exists technician_trades_org_idx     on technician_trades     (organization_id);
create index if not exists tickets_org_idx               on tickets               (organization_id);
create index if not exists ticket_status_history_org_idx on ticket_status_history (organization_id);
create index if not exists ticket_attachments_org_idx    on ticket_attachments    (organization_id);
create index if not exists ticket_comments_org_idx       on ticket_comments       (organization_id);
create index if not exists ticket_feedback_org_idx       on ticket_feedback       (organization_id);
create index if not exists quotations_org_idx            on quotations            (organization_id);
create index if not exists service_reports_org_idx       on service_reports       (organization_id);
create index if not exists invoices_org_idx              on invoices              (organization_id);

-- ============================================================================
-- SECTION 5  |  RENAME ROLE ENUM VALUE 'admin' -> 'org_admin'
-- ============================================================================
-- All existing rows with role='admin' automatically flip to 'org_admin'.
-- This is a pure metadata rename; instant, no data rewrite.
do $$ begin
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
             where t.typname = 'user_role' and e.enumlabel = 'admin') then
    alter type user_role rename value 'admin' to 'org_admin';
  end if;
end $$;

-- ============================================================================
-- SECTION 6  |  DROP OLD HELPER FUNCTIONS + RECREATE
-- ============================================================================
drop function if exists is_360_admin  cascade;
drop function if exists is_360_staff  cascade;
drop function if exists auth_role     cascade;
drop function if exists auth_org      cascade;

-- Returns the caller's role from profiles, or null if no profile (e.g. platform_admin).
create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

-- Returns the caller's organization_id, or null if the caller has no profile.
create or replace function current_org_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from profiles where id = auth.uid();
$$;

-- Caller is an org_admin (any org).
create or replace function is_org_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'org_admin', false);
$$;

-- Caller is org staff = org_admin OR manager OR technician (any org).
create or replace function is_org_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from profiles where id = auth.uid()) in ('org_admin','manager','technician'),
    false
  );
$$;

-- Caller is a FeppsXFMS platform admin (crosses all orgs).
create or replace function is_platform_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_active from platform_admins where id = auth.uid()),
    false
  );
$$;

-- ============================================================================
-- SECTION 7  |  ENABLE RLS ON NEW TABLES
-- ============================================================================
alter table organizations   enable row level security;
alter table platform_admins enable row level security;
alter table invitations     enable row level security;

-- ============================================================================
-- SECTION 8  |  RLS POLICIES — NEW TABLES
-- ============================================================================

-- ORGANIZATIONS
drop policy if exists organizations_platform_all on organizations;
create policy organizations_platform_all on organizations
  for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

drop policy if exists organizations_read_own on organizations;
create policy organizations_read_own on organizations
  for select to authenticated
  using (id = current_org_id());

-- PLATFORM_ADMINS  (only platform admins can see this table; no tenant read)
drop policy if exists platform_admins_self_read on platform_admins;
create policy platform_admins_self_read on platform_admins
  for select to authenticated
  using (id = auth.uid() or is_platform_admin());

drop policy if exists platform_admins_all on platform_admins;
create policy platform_admins_all on platform_admins
  for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- INVITATIONS
drop policy if exists invitations_platform_all on invitations;
create policy invitations_platform_all on invitations
  for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

drop policy if exists invitations_org_admin_all on invitations;
create policy invitations_org_admin_all on invitations
  for all to authenticated
  using (is_org_admin() and organization_id = current_org_id())
  with check (is_org_admin() and organization_id = current_org_id());

-- ============================================================================
-- SECTION 9  |  RLS POLICIES — EXISTING TABLES, REWRITTEN
-- ============================================================================
-- Pattern for every existing policy:
--   USING/WITH CHECK now includes: is_platform_admin() OR (role check AND organization_id = current_org_id())
-- Public/anon SELECT policies are preserved as-is (they don't filter by org yet
-- because the public /report and /track flows don't have an org context in v3;
-- that gets fixed in Phase 5 when we redesign the public entry points).

-- --- CLIENTS -----------------------------------------------------------------
drop policy if exists clients_read_all      on clients;
drop policy if exists clients_admin_write   on clients;
drop policy if exists clients_read_public   on clients;

create policy clients_read_org on clients
  for select to authenticated
  using (is_platform_admin() or organization_id = current_org_id());

create policy clients_org_admin_write on clients
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

-- keep anon public read for the public /report form (fixed in Phase 5)
create policy clients_read_public on clients
  for select to anon using (is_active = true);

-- --- CLIENT_TENANTS ----------------------------------------------------------
drop policy if exists tenants_admin_all      on client_tenants;
drop policy if exists tenants_read_all       on client_tenants;
drop policy if exists tenants_read_public    on client_tenants;

create policy tenants_read_org on client_tenants
  for select to authenticated
  using (is_platform_admin() or organization_id = current_org_id());

create policy tenants_org_admin_all on client_tenants
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy tenants_read_public on client_tenants
  for select to anon using (is_active = true);

-- --- PROFILES ----------------------------------------------------------------
drop policy if exists profiles_read_own    on profiles;
drop policy if exists profiles_read_360    on profiles;
drop policy if exists profiles_admin_all   on profiles;
drop policy if exists profiles_update_own  on profiles;

-- self read
create policy profiles_read_own on profiles
  for select to authenticated using (id = auth.uid());

-- org staff read: same-org staff can see each other's profiles
create policy profiles_read_org on profiles
  for select to authenticated
  using (
    is_platform_admin()
    or (is_org_staff() and organization_id = current_org_id())
  );

-- org_admin manages profiles within their org
create policy profiles_org_admin_all on profiles
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

-- self-update display fields but not role/org
create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role            = (select role            from profiles where id = auth.uid())
    and organization_id = (select organization_id from profiles where id = auth.uid())
  );

-- --- TICKET_CATEGORIES -------------------------------------------------------
drop policy if exists categories_read_all     on ticket_categories;
drop policy if exists categories_admin_write  on ticket_categories;
drop policy if exists categories_read_public  on ticket_categories;

create policy categories_read_org on ticket_categories
  for select to authenticated
  using (is_platform_admin() or organization_id = current_org_id());

create policy categories_org_admin_write on ticket_categories
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy categories_read_public on ticket_categories
  for select to anon using (is_active = true);

-- --- TECHNICIAN_TRADES -------------------------------------------------------
drop policy if exists trades_read_org      on technician_trades;
drop policy if exists trades_write_org     on technician_trades;

create policy trades_read_org on technician_trades
  for select to authenticated
  using (is_platform_admin() or organization_id = current_org_id());

create policy trades_write_org on technician_trades
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

-- --- TICKETS -----------------------------------------------------------------
drop policy if exists tickets_admin_all         on tickets;
drop policy if exists tickets_tech_read         on tickets;
drop policy if exists tickets_tech_update       on tickets;
drop policy if exists tickets_requester_read    on tickets;
drop policy if exists tickets_requester_insert  on tickets;
drop policy if exists tickets_requester_close   on tickets;

create policy tickets_org_admin_all on tickets
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy tickets_tech_read on tickets
  for select to authenticated
  using (
    auth_role() = 'technician'
    and assigned_to = auth.uid()
    and organization_id = current_org_id()
  );

create policy tickets_tech_update on tickets
  for update to authenticated
  using (
    auth_role() = 'technician'
    and assigned_to = auth.uid()
    and organization_id = current_org_id()
  )
  with check (
    auth_role() = 'technician'
    and assigned_to = auth.uid()
    and organization_id = current_org_id()
    and status in ('assigned','in_progress','on_hold','resolved')
  );

create policy tickets_requester_read on tickets
  for select to authenticated
  using (
    auth_role() = 'requester'
    and raised_by = auth.uid()
    and organization_id = current_org_id()
  );

create policy tickets_requester_insert on tickets
  for insert to authenticated
  with check (
    auth_role() = 'requester'
    and raised_by = auth.uid()
    and organization_id = current_org_id()
    and status = 'submitted'
    and assigned_to is null
  );

create policy tickets_requester_close on tickets
  for update to authenticated
  using (
    auth_role() = 'requester'
    and raised_by = auth.uid()
    and organization_id = current_org_id()
    and status = 'resolved'
  )
  with check (status in ('closed','reopened'));

-- --- TICKET_STATUS_HISTORY ---------------------------------------------------
drop policy if exists history_admin_all on ticket_status_history;
drop policy if exists history_read      on ticket_status_history;

create policy history_org_admin_all on ticket_status_history
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy history_read on ticket_status_history
  for select to authenticated
  using (
    organization_id = current_org_id()
    and exists (
      select 1 from tickets t
      where t.id = ticket_status_history.ticket_id
        and (
          is_org_staff()
          or (auth_role() = 'requester'  and t.raised_by   = auth.uid())
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

-- --- TICKET_ATTACHMENTS ------------------------------------------------------
drop policy if exists attachments_admin_all on ticket_attachments;
drop policy if exists attachments_read      on ticket_attachments;
drop policy if exists attachments_insert    on ticket_attachments;

create policy attachments_org_admin_all on ticket_attachments
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy attachments_read on ticket_attachments
  for select to authenticated
  using (
    organization_id = current_org_id()
    and exists (
      select 1 from tickets t
      where t.id = ticket_attachments.ticket_id
        and (
          is_org_staff()
          or (auth_role() = 'requester'  and t.raised_by   = auth.uid())
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

create policy attachments_insert on ticket_attachments
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and organization_id = current_org_id()
    and exists (
      select 1 from tickets t
      where t.id = ticket_attachments.ticket_id
        and (
          is_org_staff()
          or t.raised_by = auth.uid()
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

-- --- TICKET_COMMENTS ---------------------------------------------------------
drop policy if exists comments_admin_all on ticket_comments;
drop policy if exists comments_read      on ticket_comments;
drop policy if exists comments_insert    on ticket_comments;

create policy comments_org_admin_all on ticket_comments
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy comments_read on ticket_comments
  for select to authenticated
  using (
    organization_id = current_org_id()
    and exists (
      select 1 from tickets t
      where t.id = ticket_comments.ticket_id
        and (
          is_org_staff()
          or (auth_role() = 'requester'  and t.raised_by   = auth.uid() and ticket_comments.is_internal = false)
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

create policy comments_insert on ticket_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and organization_id = current_org_id()
    and exists (
      select 1 from tickets t
      where t.id = ticket_comments.ticket_id
        and (
          is_org_staff()
          or (auth_role() = 'requester'  and t.raised_by   = auth.uid() and ticket_comments.is_internal = false)
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

-- --- TICKET_FEEDBACK ---------------------------------------------------------
drop policy if exists feedback_admin_all on ticket_feedback;
drop policy if exists feedback_read      on ticket_feedback;
drop policy if exists feedback_insert    on ticket_feedback;

create policy feedback_org_admin_all on ticket_feedback
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy feedback_read on ticket_feedback
  for select to authenticated
  using (
    organization_id = current_org_id()
    and (
      is_org_staff()
      or exists (
        select 1 from tickets t
        where t.id = ticket_feedback.ticket_id
          and t.raised_by = auth.uid()
      )
    )
  );

-- --- INVOICES / INVOICE_ITEMS -----------------------------------------------
drop policy if exists invoices_admin_all         on invoices;
drop policy if exists invoices_creator_all       on invoices;
drop policy if exists invoices_creator_update    on invoices;
drop policy if exists invoice_items_admin_all    on invoice_items;
drop policy if exists invoice_items_creator_all  on invoice_items;

create policy invoices_org_admin_all on invoices
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy invoices_staff_read on invoices
  for select to authenticated
  using (organization_id = current_org_id() and is_org_staff());

create policy invoices_creator_write on invoices
  for all to authenticated
  using      (organization_id = current_org_id() and created_by = auth.uid())
  with check (organization_id = current_org_id() and created_by = auth.uid());

create policy invoice_items_org_admin_all on invoice_items
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy invoice_items_staff on invoice_items
  for all to authenticated
  using (
    organization_id = current_org_id()
    and exists (
      select 1 from invoices i
      where i.id = invoice_items.invoice_id
        and (is_org_staff() or i.created_by = auth.uid())
    )
  )
  with check (
    organization_id = current_org_id()
    and exists (
      select 1 from invoices i
      where i.id = invoice_items.invoice_id
        and (is_org_staff() or i.created_by = auth.uid())
    )
  );

-- --- QUOTATIONS / QUOTATION_ITEMS -------------------------------------------
drop policy if exists quotations_admin_all       on quotations;
drop policy if exists quotations_creator_all     on quotations;
drop policy if exists quotation_items_admin_all  on quotation_items;
drop policy if exists quotation_items_creator    on quotation_items;

create policy quotations_org_admin_all on quotations
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy quotations_creator_all on quotations
  for all to authenticated
  using      (organization_id = current_org_id() and (is_org_staff() or created_by = auth.uid()))
  with check (organization_id = current_org_id() and (is_org_staff() or created_by = auth.uid()));

create policy quotation_items_org_admin_all on quotation_items
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy quotation_items_staff on quotation_items
  for all to authenticated
  using (
    organization_id = current_org_id()
    and exists (
      select 1 from quotations q
      where q.id = quotation_items.quotation_id
        and (is_org_staff() or q.created_by = auth.uid())
    )
  )
  with check (
    organization_id = current_org_id()
    and exists (
      select 1 from quotations q
      where q.id = quotation_items.quotation_id
        and (is_org_staff() or q.created_by = auth.uid())
    )
  );

-- --- SERVICE_REPORTS ---------------------------------------------------------
drop policy if exists service_reports_admin_all   on service_reports;
drop policy if exists service_reports_creator_all on service_reports;

create policy service_reports_org_admin_all on service_reports
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

create policy service_reports_creator_all on service_reports
  for all to authenticated
  using      (organization_id = current_org_id() and (is_org_staff() or created_by = auth.uid()))
  with check (organization_id = current_org_id() and (is_org_staff() or created_by = auth.uid()));

-- --- COMPANY_SETTINGS (now per-org) -----------------------------------------
drop policy if exists company_settings_read_all   on company_settings;
drop policy if exists company_settings_admin_all  on company_settings;

create policy company_settings_read_org on company_settings
  for select to authenticated
  using (is_platform_admin() or organization_id = current_org_id());

create policy company_settings_org_admin_write on company_settings
  for all to authenticated
  using      (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()))
  with check (is_platform_admin() or (is_org_admin() and organization_id = current_org_id()));

-- ============================================================================
-- SECTION 10  |  REALTIME
-- ============================================================================
alter publication supabase_realtime add table organizations;
-- (invitations + platform_admins deliberately NOT in realtime — sensitive)

-- ============================================================================
-- SECTION 11  |  RELOAD SCHEMA CACHE
-- ============================================================================
notify pgrst, 'reload schema';

-- ============================================================================
-- SECTION 12  |  VERIFY  (run these after the migration to sanity-check)
-- ============================================================================
--   select count(*) from organizations;                                            -- expect 1
--   select name, slug, plan from organizations;                                    -- expect "360 Integrated"
--   select role, count(*) from profiles group by role;                             -- expect org_admin/technician/manager/requester
--   select count(*) from tickets where organization_id is null;                    -- expect 0
--   select count(*) from clients where organization_id is null;                    -- expect 0
--   select count(*) from company_settings;                                         -- expect 1
--   select is_platform_admin();                                                    -- expect false (until you add yourself in Section 13)
--
-- ============================================================================
-- SECTION 13  |  AFTER THE MIGRATION  (do this in a separate step)
-- ============================================================================
-- 1. In Supabase Auth, create the user feppsx@gmail.com (Auto Confirm ON).
-- 2. Copy their UID. Then in SQL Editor:
--
--   insert into platform_admins (id, email, full_name)
--   values ('<paste-uid>', 'feppsx@gmail.com', 'FeppsXFMS Platform Admin');
--
-- 3. Existing user shanjith160702@gmail.com stays as org_admin of 360 Integrated
--    automatically (the rename in Section 5 flipped their role from 'admin' to
--    'org_admin', and Section 3 backfilled their organization_id).
-- ============================================================================
