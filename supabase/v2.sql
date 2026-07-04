-- =============================================================================
-- 360 Integrated — Facility Ticketing  |  v2 schema
--
-- ONE FILE — safe to paste into Supabase SQL Editor and run.
--
-- If you've already run v1 (01/02/03/04), this drops v1 objects then rebuilds
-- with the simpler "flat clients" model. You will need to re-add profile rows
-- for existing auth.users (see SETUP.md).
--
-- Model:
--   Clients     = a physical site  (e.g. Wipro / Chennai CDC5)
--   Users       = admin (360 staff) · technician (360 staff) · requester
--   Tickets     = linked to one client + free-text specific area
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Drop v1 objects (safe if they don't exist)
-- ---------------------------------------------------------------------------
drop table if exists ticket_comments        cascade;
drop table if exists ticket_attachments     cascade;
drop table if exists ticket_status_history  cascade;
drop table if exists tickets                cascade;
drop table if exists ticket_categories      cascade;
drop table if exists buildings              cascade;
drop table if exists organizations          cascade;
drop table if exists clients                cascade;
drop table if exists profiles               cascade;

drop type if exists user_role       cascade;
drop type if exists ticket_status   cascade;
drop type if exists ticket_priority cascade;

drop function if exists set_updated_at                 cascade;
drop function if exists generate_ticket_number         cascade;
drop function if exists log_ticket_status_change       cascade;
drop function if exists check_ticket_building_org      cascade;
drop function if exists auth_role                      cascade;
drop function if exists auth_org                       cascade;
drop function if exists is_360_admin                   cascade;
drop function if exists is_360_staff                   cascade;

drop sequence if exists ticket_number_seq cascade;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('admin', 'technician', 'requester');

create type ticket_status as enum (
  'submitted', 'assigned', 'in_progress', 'on_hold',
  'resolved', 'closed', 'reopened', 'cancelled'
);

create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- ---------------------------------------------------------------------------
-- CLIENTS  — the flat list managed by 360 admin
-- ---------------------------------------------------------------------------
create table clients (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,             -- e.g. "Wipro"
  location       text not null,             -- e.g. "Chennai CDC5"
  address        text,                      -- optional full address
  contact_email  citext,
  contact_phone  text,
  notes          text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (name, location)                   -- Wipro/Chennai vs Wipro/Bangalore both allowed
);
create index on clients (is_active);

-- ---------------------------------------------------------------------------
-- PROFILES  — extends auth.users with role + display fields
-- ---------------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        user_role not null,
  phone       text,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on profiles (role);

-- ---------------------------------------------------------------------------
-- TICKET CATEGORIES  — lookup table (admin can edit)
-- ---------------------------------------------------------------------------
create table ticket_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  description  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TICKETS
-- ---------------------------------------------------------------------------
create sequence ticket_number_seq start 1;

create or replace function generate_ticket_number()
returns text language plpgsql as $$
declare next_val bigint;
begin
  next_val := nextval('ticket_number_seq');
  return 'TKT-' || to_char(now(), 'YYYY') || '-' || lpad(next_val::text, 6, '0');
end;
$$;

create table tickets (
  id              uuid primary key default gen_random_uuid(),
  ticket_number   text not null unique default generate_ticket_number(),

  title           text not null check (char_length(title) between 3 and 200),
  description     text not null,

  status          ticket_status   not null default 'submitted',
  priority        ticket_priority not null default 'medium',
  category_id     uuid references ticket_categories(id) on delete set null,

  client_id       uuid not null references clients(id) on delete restrict,
  specific_area   text,   -- e.g. "4th floor B wing"

  raised_by       uuid not null references profiles(id) on delete restrict,
  assigned_to     uuid references profiles(id) on delete set null,
  assigned_by     uuid references profiles(id) on delete set null,
  assigned_at     timestamptz,
  resolved_at     timestamptz,
  closed_at       timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on tickets (client_id, status);
create index on tickets (assigned_to, status);
create index on tickets (raised_by);
create index on tickets (status);
create index on tickets (created_at desc);

-- Audit log of every status change (auto-written by trigger).
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

-- Photos and files on a ticket.
create table ticket_attachments (
  id            uuid primary key default gen_random_uuid(),
  ticket_id     uuid not null references tickets(id) on delete cascade,
  uploaded_by   uuid references profiles(id) on delete set null,
  storage_path  text not null,
  file_name     text not null,
  mime_type     text,
  file_size     bigint,
  kind          text not null default 'issue_photo'
                check (kind in ('issue_photo','progress_photo','resolution_photo','other')),
  created_at    timestamptz not null default now()
);
create index on ticket_attachments (ticket_id);

-- Comments (client visible + internal).
create table ticket_comments (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references tickets(id) on delete cascade,
  author_id    uuid not null references profiles(id) on delete set null,
  body         text not null check (char_length(body) >= 1),
  is_internal  boolean not null default false,
  created_at   timestamptz not null default now()
);
create index on ticket_comments (ticket_id, created_at);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

create trigger trg_clients_updated  before update on clients
  for each row execute function set_updated_at();
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_tickets_updated  before update on tickets
  for each row execute function set_updated_at();

create or replace function log_ticket_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into ticket_status_history (ticket_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, new.raised_by);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into ticket_status_history (ticket_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());

    if new.status = 'assigned'   and old.status <> 'assigned'   then new.assigned_at := coalesce(new.assigned_at, now()); end if;
    if new.status = 'resolved'   and old.status <> 'resolved'   then new.resolved_at := coalesce(new.resolved_at, now()); end if;
    if new.status = 'closed'     and old.status <> 'closed'     then new.closed_at   := coalesce(new.closed_at,   now()); end if;
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

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER — bypass RLS to avoid recursion)
-- ---------------------------------------------------------------------------
create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_360_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'admin', false);
$$;

create or replace function is_360_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from profiles where id = auth.uid()) in ('admin','technician'),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table clients               enable row level security;
alter table profiles              enable row level security;
alter table ticket_categories     enable row level security;
alter table tickets               enable row level security;
alter table ticket_status_history enable row level security;
alter table ticket_attachments    enable row level security;
alter table ticket_comments       enable row level security;

-- CLIENTS: everyone signed-in can read (needed for the Location dropdown).
--          Only 360 admin can insert/update/delete.
create policy clients_read_all on clients
  for select to authenticated using (true);

create policy clients_admin_write on clients
  for all to authenticated
  using (is_360_admin())
  with check (is_360_admin());

-- PROFILES:
create policy profiles_read_own on profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_read_360 on profiles
  for select to authenticated using (is_360_staff());

create policy profiles_admin_all on profiles
  for all to authenticated
  using (is_360_admin())
  with check (is_360_admin());

-- Own profile: user can update display fields but not their role.
create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from profiles where id = auth.uid())
  );

-- CATEGORIES:
create policy categories_read_all on ticket_categories
  for select to authenticated using (true);

create policy categories_admin_write on ticket_categories
  for all to authenticated
  using (is_360_admin())
  with check (is_360_admin());

-- TICKETS:
create policy tickets_admin_all on tickets
  for all to authenticated
  using (is_360_admin())
  with check (is_360_admin());

create policy tickets_tech_read on tickets
  for select to authenticated
  using (auth_role() = 'technician' and assigned_to = auth.uid());

create policy tickets_tech_update on tickets
  for update to authenticated
  using (auth_role() = 'technician' and assigned_to = auth.uid())
  with check (
    auth_role() = 'technician'
    and assigned_to = auth.uid()
    and status in ('assigned','in_progress','on_hold','resolved')
  );

create policy tickets_requester_read on tickets
  for select to authenticated
  using (auth_role() = 'requester' and raised_by = auth.uid());

create policy tickets_requester_insert on tickets
  for insert to authenticated
  with check (
    auth_role() = 'requester'
    and raised_by = auth.uid()
    and status = 'submitted'
    and assigned_to is null
  );

create policy tickets_requester_close on tickets
  for update to authenticated
  using (
    auth_role() = 'requester'
    and raised_by = auth.uid()
    and status = 'resolved'
  )
  with check (status in ('closed','reopened'));

-- STATUS HISTORY (read-only in the app; written by trigger):
create policy history_admin_all on ticket_status_history
  for all to authenticated
  using (is_360_admin())
  with check (is_360_admin());

create policy history_read on ticket_status_history
  for select to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_status_history.ticket_id
        and (
          is_360_staff()
          or (auth_role() = 'requester' and t.raised_by = auth.uid())
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

-- ATTACHMENTS:
create policy attachments_admin_all on ticket_attachments
  for all to authenticated
  using (is_360_admin())
  with check (is_360_admin());

create policy attachments_read on ticket_attachments
  for select to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_attachments.ticket_id
        and (
          is_360_staff()
          or (auth_role() = 'requester'  and t.raised_by = auth.uid())
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

create policy attachments_insert on ticket_attachments
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from tickets t
      where t.id = ticket_attachments.ticket_id
        and (
          is_360_staff()
          or t.raised_by = auth.uid()
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

-- COMMENTS:
create policy comments_admin_all on ticket_comments
  for all to authenticated
  using (is_360_admin())
  with check (is_360_admin());

create policy comments_read on ticket_comments
  for select to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_comments.ticket_id
        and (
          is_360_staff()
          or (auth_role() = 'requester' and t.raised_by = auth.uid() and ticket_comments.is_internal = false)
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

create policy comments_insert on ticket_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from tickets t
      where t.id = ticket_comments.ticket_id
        and (
          is_360_staff()
          or (auth_role() = 'requester' and t.raised_by = auth.uid() and ticket_comments.is_internal = false)
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Seed data — categories + a couple of example clients
-- ---------------------------------------------------------------------------
insert into ticket_categories (name, description) values
  ('Electrical',      'Lighting, power sockets, wiring, breakers'),
  ('Plumbing',        'Leaks, blockages, taps, toilets, water supply'),
  ('HVAC / Aircon',   'Air conditioning, ventilation, heating'),
  ('Lift / Elevator', 'Lift faults, alarms, maintenance'),
  ('Cleaning',        'Cleaning requests and spills'),
  ('Security',        'Access cards, CCTV, alarms, locks'),
  ('Carpentry',       'Doors, windows, furniture, partitions'),
  ('Pest Control',    'Pest sightings and treatment'),
  ('General',         'Anything not covered above')
on conflict (name) do nothing;

insert into clients (name, location, address) values
  ('Wipro',           'Chennai CDC5',   'Sholinganallur, Chennai'),
  ('Wipro',           'Bangalore SEZ',  'Sarjapur Road, Bangalore'),
  ('Prestige Centre', 'Singapore',      '1 Prestige Road, Singapore')
on conflict (name, location) do nothing;

-- ---------------------------------------------------------------------------
-- Realtime (used by the UI so status changes appear live)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table ticket_status_history;
alter publication supabase_realtime add table ticket_attachments;
alter publication supabase_realtime add table ticket_comments;
