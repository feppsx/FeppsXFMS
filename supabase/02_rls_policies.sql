-- =============================================================================
-- 360 Integrated — Facility Ticketing System
-- 02_rls_policies.sql  |  Row-Level Security
-- Run this AFTER 01_schema.sql.
--
-- Rule summary:
--   admin        (360 staff)    -> full access
--   technician   (360 staff)    -> read/update ONLY tickets assigned to them
--   client_admin (client staff) -> read all tickets in their organization
--   client_user  (client staff) -> read all tickets in their organization,
--                                  can raise new tickets, can close/reopen own
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions — SECURITY DEFINER so they can read `profiles` without
-- triggering the same RLS policies (which would cause infinite recursion).
-- ---------------------------------------------------------------------------

create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function auth_org()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

create or replace function is_360_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'admin', false);
$$;

create or replace function is_360_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from profiles where id = auth.uid()) in ('admin','technician'),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table.
-- ---------------------------------------------------------------------------
alter table organizations         enable row level security;
alter table buildings             enable row level security;
alter table profiles              enable row level security;
alter table ticket_categories     enable row level security;
alter table tickets               enable row level security;
alter table ticket_status_history enable row level security;
alter table ticket_attachments    enable row level security;
alter table ticket_comments       enable row level security;

-- ===========================================================================
-- organizations
-- ===========================================================================

-- 360 admins: full access.
create policy orgs_admin_all on organizations
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

-- Everyone else can read their own org (360 techs read all so they know building context).
create policy orgs_read_self on organizations
  for select to authenticated
  using (
    is_360_staff() or id = auth_org()
  );

-- ===========================================================================
-- buildings
-- ===========================================================================

create policy buildings_admin_all on buildings
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

create policy buildings_read on buildings
  for select to authenticated
  using (
    is_360_staff() or organization_id = auth_org()
  );

-- ===========================================================================
-- profiles
-- ===========================================================================

-- Anyone can read their own profile.
create policy profiles_read_own on profiles
  for select to authenticated
  using (id = auth.uid());

-- 360 admins can read/write all profiles.
create policy profiles_admin_all on profiles
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

-- 360 techs can read other 360 staff + client contacts (needed to display names
-- on tickets they're working on).
create policy profiles_read_360 on profiles
  for select to authenticated
  using (is_360_staff());

-- Client staff can read profiles inside their own org (to see who raised a ticket).
create policy profiles_read_same_org on profiles
  for select to authenticated
  using (
    organization_id is not null and organization_id = auth_org()
  );

-- Anyone can update their OWN profile (name, phone, avatar). Cannot change role/org.
create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from profiles where id = auth.uid())
    and organization_id is not distinct from (select organization_id from profiles where id = auth.uid())
  );

-- ===========================================================================
-- ticket_categories  (small, mostly read-only lookup table)
-- ===========================================================================

create policy categories_read_all on ticket_categories
  for select to authenticated using (true);

create policy categories_admin_write on ticket_categories
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

-- ===========================================================================
-- tickets
-- ===========================================================================

-- 360 admins: full access.
create policy tickets_admin_all on tickets
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

-- Technicians: read only their assigned tickets.
create policy tickets_tech_read on tickets
  for select to authenticated
  using (
    auth_role() = 'technician' and assigned_to = auth.uid()
  );

-- Technicians: update status/notes on assigned tickets. Cannot reassign.
create policy tickets_tech_update on tickets
  for update to authenticated
  using (
    auth_role() = 'technician' and assigned_to = auth.uid()
  )
  with check (
    auth_role() = 'technician'
    and assigned_to = auth.uid()   -- cannot reassign to someone else
    -- technicians are allowed to move through in_progress / on_hold / resolved
    and status in ('assigned','in_progress','on_hold','resolved')
  );

-- Client users/admins: read all tickets in their org.
create policy tickets_client_read on tickets
  for select to authenticated
  using (
    auth_role() in ('client_admin','client_user')
    and organization_id = auth_org()
  );

-- Client users/admins: insert tickets for their own org, raised_by must be self,
-- and only in the initial 'submitted' state.
create policy tickets_client_insert on tickets
  for insert to authenticated
  with check (
    auth_role() in ('client_admin','client_user')
    and organization_id = auth_org()
    and raised_by = auth.uid()
    and status = 'submitted'
    and assigned_to is null
  );

-- Client raiser can move a resolved ticket -> closed OR reopened (confirming/rejecting fix).
create policy tickets_client_close_reopen on tickets
  for update to authenticated
  using (
    auth_role() in ('client_admin','client_user')
    and organization_id = auth_org()
    and raised_by = auth.uid()
    and status = 'resolved'
  )
  with check (
    status in ('closed','reopened')
  );

-- ===========================================================================
-- ticket_status_history  (read-only from app; written by trigger)
-- ===========================================================================

create policy history_admin_all on ticket_status_history
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

create policy history_read on ticket_status_history
  for select to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_status_history.ticket_id
        and (
          is_360_staff()
          or (auth_role() in ('client_admin','client_user') and t.organization_id = auth_org())
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

-- ===========================================================================
-- ticket_attachments
-- ===========================================================================

create policy attachments_admin_all on ticket_attachments
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

-- Read: anyone who can see the ticket can see its attachments.
create policy attachments_read on ticket_attachments
  for select to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_attachments.ticket_id
        and (
          is_360_staff()
          or (auth_role() in ('client_admin','client_user') and t.organization_id = auth_org())
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

-- Insert: uploader is self, and they must be able to see the ticket.
create policy attachments_insert on ticket_attachments
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from tickets t
      where t.id = ticket_attachments.ticket_id
        and (
          is_360_staff()
          or (t.raised_by = auth.uid())
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

-- ===========================================================================
-- ticket_comments
-- ===========================================================================

create policy comments_admin_all on ticket_comments
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

-- Read: same visibility as ticket, BUT clients cannot see internal comments.
create policy comments_read on ticket_comments
  for select to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_comments.ticket_id
        and (
          is_360_staff()
          or (
            auth_role() in ('client_admin','client_user')
            and t.organization_id = auth_org()
            and ticket_comments.is_internal = false
          )
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

-- Insert: author is self; clients can only post non-internal comments.
create policy comments_insert on ticket_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from tickets t
      where t.id = ticket_comments.ticket_id
        and (
          is_360_staff()
          or (
            auth_role() in ('client_admin','client_user')
            and t.organization_id = auth_org()
            and ticket_comments.is_internal = false
          )
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );
