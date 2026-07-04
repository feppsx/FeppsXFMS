-- =============================================================================
-- 360 Integrated — Facility Ticketing System
-- 01_schema.sql  |  Core tables, enums, triggers
-- Run this FIRST in the Supabase SQL Editor.
-- =============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- case-insensitive text (emails)

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Who the user is in the system.
--   client_admin  = main contact at a client org (e.g., Prestige Centre facility manager)
--   client_user   = staff at a client org who raises tickets
--   admin         = 360 Integrated staff (full access, assigns technicians)
--   technician    = 360 Integrated field worker (sees only assigned jobs)
create type user_role as enum (
  'client_admin',
  'client_user',
  'admin',
  'technician'
);

-- Lifecycle of a ticket.
create type ticket_status as enum (
  'submitted',    -- just raised by client
  'assigned',     -- admin has assigned a technician
  'in_progress',  -- technician has started work
  'on_hold',      -- waiting for parts / access / client
  'resolved',     -- technician says fixed
  'closed',       -- client confirms fix (or auto-close after N days)
  'reopened',     -- client rejects the fix
  'cancelled'     -- withdrawn
);

create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Client companies (Prestige Centre, Lam Soon Building, ...)
create table organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null unique,
  contact_email  citext,
  contact_phone  text,
  address        text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- A single organization may own/manage multiple buildings.
create table buildings (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text not null,
  address          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, name)
);
create index on buildings (organization_id);

-- Ticket categories — kept as a table (not enum) so admin can add new ones from the portal
-- without a DB migration (e.g., a client says "we also want a Pest Control category").
create table ticket_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  description  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Profiles extend auth.users. auth.users is managed by Supabase Auth;
-- profiles holds our app-specific fields (role, org, name).
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text not null,
  role             user_role not null,
  organization_id  uuid references organizations(id) on delete set null,
  -- CHECK: client_* roles MUST belong to an organization; 360 staff MUST NOT.
  constraint profiles_role_org_ck check (
    (role in ('client_admin','client_user') and organization_id is not null)
    or
    (role in ('admin','technician') and organization_id is null)
  ),
  phone            text,
  avatar_url       text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on profiles (organization_id);
create index on profiles (role);

-- =============================================================================
-- TICKETS
-- =============================================================================

-- Sequence + function for human-readable ticket numbers (TKT-2026-000001).
create sequence ticket_number_seq start 1;

create or replace function generate_ticket_number()
returns text
language plpgsql
as $$
declare
  next_val bigint;
begin
  next_val := nextval('ticket_number_seq');
  return 'TKT-' || to_char(now(), 'YYYY') || '-' || lpad(next_val::text, 6, '0');
end;
$$;

create table tickets (
  id                uuid primary key default gen_random_uuid(),
  ticket_number     text not null unique default generate_ticket_number(),

  title             text not null check (char_length(title) between 3 and 200),
  description       text not null,

  status            ticket_status not null default 'submitted',
  priority          ticket_priority not null default 'medium',

  category_id       uuid references ticket_categories(id) on delete set null,

  -- organization_id is duplicated from buildings for RLS speed (RLS runs on every row read;
  -- a direct FK check is faster than a join).
  organization_id   uuid not null references organizations(id) on delete cascade,
  building_id       uuid not null references buildings(id) on delete restrict,
  location_detail   text,  -- e.g. "4th floor, west wing, corridor lights near lift lobby"

  raised_by         uuid not null references profiles(id) on delete restrict,
  assigned_to       uuid references profiles(id) on delete set null,   -- technician
  assigned_by       uuid references profiles(id) on delete set null,   -- admin who assigned
  assigned_at       timestamptz,
  resolved_at       timestamptz,
  closed_at         timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on tickets (organization_id, status);
create index on tickets (assigned_to, status);
create index on tickets (raised_by);
create index on tickets (status);
create index on tickets (created_at desc);

-- Audit log — every status change is recorded so client + admin can see the timeline.
create table ticket_status_history (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references tickets(id) on delete cascade,
  from_status  ticket_status,
  to_status    ticket_status not null,
  changed_by   uuid references profiles(id) on delete set null,
  notes        text,
  created_at   timestamptz not null default now()
);
create index on ticket_status_history (ticket_id, created_at);

-- Photos / files attached to a ticket.
-- storage_path points at a file in Supabase Storage bucket 'ticket-attachments'.
create table ticket_attachments (
  id            uuid primary key default gen_random_uuid(),
  ticket_id     uuid not null references tickets(id) on delete cascade,
  uploaded_by   uuid references profiles(id) on delete set null,
  storage_path  text not null,           -- e.g. tickets/<ticket_id>/<uuid>.jpg
  file_name     text not null,
  mime_type     text,
  file_size     bigint,
  kind          text not null default 'issue_photo'
                check (kind in ('issue_photo','progress_photo','resolution_photo','other')),
  created_at    timestamptz not null default now()
);
create index on ticket_attachments (ticket_id);

-- Comment thread on a ticket. is_internal = true means client cannot see it
-- (admins/technicians can leave private notes for each other).
create table ticket_comments (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references tickets(id) on delete cascade,
  author_id    uuid not null references profiles(id) on delete set null,
  body         text not null check (char_length(body) >= 1),
  is_internal  boolean not null default false,
  created_at   timestamptz not null default now()
);
create index on ticket_comments (ticket_id, created_at);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Generic updated_at bumper.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_orgs_updated       before update on organizations
  for each row execute function set_updated_at();
create trigger trg_buildings_updated  before update on buildings
  for each row execute function set_updated_at();
create trigger trg_profiles_updated   before update on profiles
  for each row execute function set_updated_at();
create trigger trg_tickets_updated    before update on tickets
  for each row execute function set_updated_at();

-- When tickets.status changes, log to ticket_status_history and stamp
-- assigned_at / resolved_at / closed_at automatically.
create or replace function log_ticket_status_change()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into ticket_status_history (ticket_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, new.raised_by);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into ticket_status_history (ticket_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());

    if new.status = 'assigned' and old.status <> 'assigned' then
      new.assigned_at := coalesce(new.assigned_at, now());
    end if;
    if new.status = 'resolved' and old.status <> 'resolved' then
      new.resolved_at := coalesce(new.resolved_at, now());
    end if;
    if new.status = 'closed' and old.status <> 'closed' then
      new.closed_at := coalesce(new.closed_at, now());
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_tickets_status_insert
  after insert on tickets
  for each row execute function log_ticket_status_change();

create trigger trg_tickets_status_update
  before update on tickets
  for each row execute function log_ticket_status_change();

-- Sanity: building must belong to the ticket's organization.
create or replace function check_ticket_building_org()
returns trigger language plpgsql as $$
declare
  b_org uuid;
begin
  select organization_id into b_org from buildings where id = new.building_id;
  if b_org is null then
    raise exception 'Building % not found', new.building_id;
  end if;
  if b_org <> new.organization_id then
    raise exception 'Building does not belong to the ticket''s organization';
  end if;
  return new;
end;
$$;

create trigger trg_tickets_building_org_check
  before insert or update on tickets
  for each row execute function check_ticket_building_org();
