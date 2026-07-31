
-- =============================================================================
-- PATCH 1
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #1
-- Run this in Supabase SQL Editor.
--
-- Fixes:
--   1. "new row violates row-level security policy for table ticket_status_history"
--      when a requester creates a ticket. The BEFORE-INSERT trigger writes a
--      status-history row as the current user, which RLS blocks. We make the
--      trigger SECURITY DEFINER so it runs as the function owner (postgres),
--      bypassing RLS for that internal audit write.
--
--   2. 400 on image upload. Simpler storage-bucket policies that just allow
--      any authenticated user to work inside the `tickets/` folder.
-- =============================================================================

-- --- Fix 1: trigger runs as owner --------------------------------------------
alter function log_ticket_status_change() security definer;

-- --- Fix 2: simpler storage policies for the ticket-attachments bucket -------
-- Requires: the bucket 'ticket-attachments' exists (Storage -> New bucket -> off Public).

-- Drop any old policies you might have created previously (safe if none exist).
drop policy if exists "auth read"       on storage.objects;
drop policy if exists "auth insert"     on storage.objects;
drop policy if exists "owner delete"    on storage.objects;
drop policy if exists "admin all"       on storage.objects;
drop policy if exists "ticket attachments authenticated" on storage.objects;

-- One policy: any authenticated user can read/write/delete inside tickets/*
-- in the ticket-attachments bucket. RLS on our `ticket_attachments` table still
-- controls who can LINK a file to a ticket, which is the actual access gate.
create policy "ticket attachments authenticated"
  on storage.objects
  for all
  to authenticated
  using  (bucket_id = 'ticket-attachments' and (storage.foldername(name))[1] = 'tickets')
  with check (bucket_id = 'ticket-attachments' and (storage.foldername(name))[1] = 'tickets');


-- =============================================================================
-- PATCH 2
-- =============================================================================
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


-- =============================================================================
-- PATCH 3
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #3
-- Run this in Supabase SQL Editor.
--
-- Adds:
--   * technician_trades — many-to-many between technicians (profiles.role='technician')
--     and ticket_categories. One tech can cover Electrical + General, another
--     covers only Plumbing, etc.
--   * RLS: any signed-in user can READ trades (needed for the assign dropdown
--     to show which tech does what). Admin writes only.
-- =============================================================================

create table if not exists technician_trades (
  technician_id  uuid not null references profiles(id) on delete cascade,
  category_id    uuid not null references ticket_categories(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (technician_id, category_id)
);
create index if not exists technician_trades_tech_idx on technician_trades (technician_id);
create index if not exists technician_trades_cat_idx  on technician_trades (category_id);

alter table technician_trades enable row level security;

-- Drop-then-create so re-running the patch is safe.
drop policy if exists trades_read_all      on technician_trades;
drop policy if exists trades_admin_write   on technician_trades;

create policy trades_read_all on technician_trades
  for select to authenticated using (true);

create policy trades_admin_write on technician_trades
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

-- Broadcast changes so the admin UI updates live when trades are edited.
alter publication supabase_realtime add table technician_trades;


-- =============================================================================
-- PATCH 4
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #4
-- Run this in Supabase SQL Editor.
--
-- Adds "Tenants" — companies inside a multi-tenant building (e.g. Google at
-- Prestige Centre). Single-company sites like Wipro leave the tenants list
-- empty and the ticket form skips the Tenant dropdown.
-- =============================================================================

create table if not exists client_tenants (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients(id) on delete cascade,
  name           text not null,               -- e.g. "Google"
  contact_email  citext,
  contact_phone  text,
  notes          text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (client_id, name)
);
create index if not exists client_tenants_client_idx on client_tenants (client_id);

-- Bump updated_at on edit.
drop trigger if exists trg_client_tenants_updated on client_tenants;
create trigger trg_client_tenants_updated  before update on client_tenants
  for each row execute function set_updated_at();

-- tickets.tenant_id — optional link to a tenant.
alter table tickets
  add column if not exists tenant_id uuid references client_tenants(id) on delete set null;
create index if not exists tickets_tenant_idx on tickets (tenant_id);

-- Sanity check: tenant (if any) must belong to the ticket's client.
create or replace function check_ticket_tenant_client()
returns trigger language plpgsql as $$
declare
  t_client uuid;
begin
  if new.tenant_id is null then return new; end if;
  select client_id into t_client from client_tenants where id = new.tenant_id;
  if t_client is null then
    raise exception 'Tenant % not found', new.tenant_id;
  end if;
  if t_client <> new.client_id then
    raise exception 'Tenant does not belong to the ticket''s client';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tickets_tenant_client_check on tickets;
create trigger trg_tickets_tenant_client_check
  before insert or update on tickets
  for each row execute function check_ticket_tenant_client();

-- RLS ---------------------------------------------------------------------
alter table client_tenants enable row level security;

drop policy if exists tenants_read_all    on client_tenants;
drop policy if exists tenants_admin_write on client_tenants;

-- Anyone signed-in can read tenants (needed for the requester's dropdown).
create policy tenants_read_all on client_tenants
  for select to authenticated using (true);

-- Only 360 admin can create/edit/delete tenants.
create policy tenants_admin_write on client_tenants
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

-- Realtime so admin UI updates live.
alter publication supabase_realtime add table client_tenants;


-- =============================================================================
-- PATCH 5
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #5
-- Run this in Supabase SQL Editor.
--
-- Adds invoicing:
--   * invoices          — one row per invoice (linked to a ticket)
--   * invoice_items     — many line items per invoice
--   * receipt-number sequence  → INV-YYYY-000123
-- =============================================================================

create sequence if not exists invoice_number_seq start 1;

create or replace function generate_invoice_number()
returns text language plpgsql as $$
declare next_val bigint;
begin
  next_val := nextval('invoice_number_seq');
  return 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(next_val::text, 6, '0');
end;
$$;

create table if not exists invoices (
  id                uuid primary key default gen_random_uuid(),
  receipt_no        text not null unique default generate_invoice_number(),

  ticket_id         uuid not null unique references tickets(id) on delete cascade,
  created_by        uuid references profiles(id) on delete set null,

  -- Customer snapshot (copied from client/tenant at creation time so future edits
  -- to the client don't rewrite historical invoices).
  customer_name     text not null,
  customer_address  text,
  contact_no        text,

  invoice_date      date not null default current_date,
  time_in           text,   -- free text like "09:30" or "9:30 AM"
  time_out          text,

  -- Money fields — numeric(12,2) leaves headroom well past any facility invoice.
  subtotal          numeric(12,2) not null default 0,
  discount          numeric(12,2) not null default 0,
  gst_amount        numeric(12,2) not null default 0,
  deposit_amount    numeric(12,2) not null default 0,
  grand_total       numeric(12,2) not null default 0,

  notes             text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists invoices_ticket_idx on invoices (ticket_id);
create index if not exists invoices_created_by_idx on invoices (created_by);

create table if not exists invoice_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  description  text not null,
  unit_price   numeric(12,2) not null default 0,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists invoice_items_invoice_idx on invoice_items (invoice_id, sort_order);

-- updated_at trigger
drop trigger if exists trg_invoices_updated on invoices;
create trigger trg_invoices_updated before update on invoices
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table invoices       enable row level security;
alter table invoice_items  enable row level security;

drop policy if exists invoices_admin_all   on invoices;
drop policy if exists invoices_tech_write  on invoices;
drop policy if exists invoices_tech_read   on invoices;
drop policy if exists invoices_client_read on invoices;

-- 360 admins: full access.
create policy invoices_admin_all on invoices
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

-- Technicians: can create / read / update invoices for tickets assigned to them.
create policy invoices_tech_read on invoices
  for select to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = invoices.ticket_id and t.assigned_to = auth.uid()
    )
  );

create policy invoices_tech_write on invoices
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from tickets t
      where t.id = invoices.ticket_id and t.assigned_to = auth.uid()
    )
  );

-- Requesters: read invoices for tickets they raised.
create policy invoices_client_read on invoices
  for select to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = invoices.ticket_id
        and auth_role() = 'requester'
        and t.raised_by = auth.uid()
    )
  );

-- Items: same visibility as their parent invoice.
drop policy if exists items_admin_all   on invoice_items;
drop policy if exists items_read        on invoice_items;
drop policy if exists items_tech_write  on invoice_items;

create policy items_admin_all on invoice_items
  for all to authenticated
  using  (is_360_admin())
  with check (is_360_admin());

create policy items_read on invoice_items
  for select to authenticated
  using (
    exists (
      select 1 from invoices i
      join tickets t on t.id = i.ticket_id
      where i.id = invoice_items.invoice_id
        and (
          is_360_staff()
          or (auth_role() = 'requester'  and t.raised_by = auth.uid())
          or (auth_role() = 'technician' and t.assigned_to = auth.uid())
        )
    )
  );

create policy items_tech_write on invoice_items
  for insert to authenticated
  with check (
    exists (
      select 1 from invoices i
      join tickets t on t.id = i.ticket_id
      where i.id = invoice_items.invoice_id
        and t.assigned_to = auth.uid()
        and auth_role() = 'technician'
    )
  );

-- Realtime.
alter publication supabase_realtime add table invoices;
alter publication supabase_realtime add table invoice_items;


-- =============================================================================
-- PATCH 6
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #6
-- Run this in Supabase SQL Editor.
--
-- Adds:
--   * profiles.signature_path — optional storage path pointing at the user's
--     signature image (stored in the 'signatures' bucket). Used by:
--       - Admin: uploads on behalf of the tech when adding/editing a technician
--       - Technician: uploads themselves via /technician/profile
--       - Invoice PDF: renders the image above the "Technical Team Leader" line
--         only if the assigned tech has one
--
-- Also: create the 'signatures' storage bucket from the Supabase Dashboard
-- (Storage → New bucket → name: signatures → Public bucket: ON → Save).
-- No storage policies needed if the bucket is public.
-- =============================================================================

alter table profiles
  add column if not exists signature_path text;


-- =============================================================================
-- PATCH 7
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #7
-- Run this in Supabase SQL Editor.
--
-- Adds storage-object policy so authenticated users can UPLOAD to the
-- 'signatures' bucket. "Public bucket" only means public READ; writes still
-- need an explicit policy.
-- =============================================================================

drop policy if exists "signatures authenticated write" on storage.objects;

create policy "signatures authenticated write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'signatures')
  with check (bucket_id = 'signatures');


-- =============================================================================
-- PATCH 8
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #8
-- Run this in Supabase SQL Editor.
--
-- Adds:
--   * invoices.is_paid  — one-click paid/unpaid toggle from admin
--   * invoices.paid_at  — timestamp when marked paid
--   * paid_by           — profile who marked it paid
--   * an index for the dashboard "tickets per day" query
--   * an index for the admin invoice list ordering
-- =============================================================================

alter table invoices
  add column if not exists is_paid  boolean not null default false,
  add column if not exists paid_at  timestamptz,
  add column if not exists paid_by  uuid references profiles(id) on delete set null;

create index if not exists invoices_is_paid_idx on invoices (is_paid, invoice_date desc);
create index if not exists tickets_created_day_idx on tickets (created_at desc);


-- =============================================================================
-- PATCH 9
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #9
-- Run in Supabase SQL Editor.
--
-- Adds a `color` column to ticket_categories so admins can pick a hue for
-- each category. The chosen color drives colored pills on ticket rows,
-- detail pages, and eventually filter chips.
--
-- Existing categories get sensible default colors based on their name.
-- =============================================================================

alter table ticket_categories
  add column if not exists color text not null default '#64748b';   -- slate-500

-- Seed defaults for the pre-populated categories from v2.sql
update ticket_categories set color = '#f59e0b' where name = 'Electrical'      and color = '#64748b';
update ticket_categories set color = '#3b82f6' where name = 'Plumbing'        and color = '#64748b';
update ticket_categories set color = '#06b6d4' where name = 'HVAC / Aircon'   and color = '#64748b';
update ticket_categories set color = '#a855f7' where name = 'Lift / Elevator' and color = '#64748b';
update ticket_categories set color = '#10b981' where name = 'Cleaning'        and color = '#64748b';
update ticket_categories set color = '#ef4444' where name = 'Security'        and color = '#64748b';
update ticket_categories set color = '#f97316' where name = 'Carpentry'       and color = '#64748b';
update ticket_categories set color = '#84cc16' where name = 'Pest Control'    and color = '#64748b';


-- =============================================================================
-- PATCH 10
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #10
-- Run this in Supabase SQL Editor.
--
-- Enables the anonymous QR/link ticket flow.
--   * Adds contact fields + a random tracking_token to tickets
--   * Makes raised_by nullable (anonymous tickets have no linked profile)
--   * Auto-generates a friendly 8-char tracking token like "TRK-A3B4C5D6"
--   * Opens SELECT on active clients/tenants/categories to the anon role
--     (needed for the public form's dropdowns to work)
--   * Opens INSERT on the ticket-attachments storage bucket to anon under
--     the tickets/new/ prefix (needed for client-side photo uploads)
--   * All ticket INSERT and read-by-token operations still happen server-side
--     via the service-role key so the tracking token stays the "auth."
-- =============================================================================

-- 1. New columns on tickets ---------------------------------------------------

alter table tickets
  add column if not exists requester_name  text,
  add column if not exists requester_email text,
  add column if not exists requester_phone text,
  add column if not exists tracking_token  text unique;

alter table tickets alter column raised_by drop not null;

create index if not exists tickets_tracking_token_idx on tickets (tracking_token);

-- 2. Tracking-token generator (avoids ambiguous chars: 0, O, 1, I, L) ---------

create or replace function generate_tracking_token()
returns text
language plpgsql
volatile
as $$
declare
  charset text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result  text := 'TRK-';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(charset, 1 + floor(random() * length(charset))::int, 1);
  end loop;
  return result;
end;
$$;

-- Auto-set tracking_token on insert, retrying on the astronomically-rare collision.
create or replace function set_tracking_token()
returns trigger
language plpgsql
as $$
begin
  if new.tracking_token is null then
    loop
      new.tracking_token := generate_tracking_token();
      exit when not exists (select 1 from tickets where tracking_token = new.tracking_token);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tickets_tracking_token on tickets;
create trigger trg_tickets_tracking_token
  before insert on tickets
  for each row execute function set_tracking_token();

-- 3. Anon SELECT on active reference tables (form dropdowns) ------------------

drop policy if exists categories_read_public on ticket_categories;
create policy categories_read_public on ticket_categories
  for select to anon using (is_active = true);

drop policy if exists clients_read_public on clients;
create policy clients_read_public on clients
  for select to anon using (is_active = true);

drop policy if exists tenants_read_public on client_tenants;
create policy tenants_read_public on client_tenants
  for select to anon using (is_active = true);

-- 4. Anon INSERT into storage — only under tickets/new/* ---------------------

drop policy if exists "ticket attachments anon upload" on storage.objects;
create policy "ticket attachments anon upload"
  on storage.objects
  for insert to anon
  with check (
    bucket_id = 'ticket-attachments'
    and (storage.foldername(name))[1] = 'tickets'
    and (storage.foldername(name))[2] = 'new'
  );


-- =============================================================================
-- PATCH 11
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #11
-- Run this in Supabase SQL Editor.
--
-- Phase 1 of the "Estate" refactor + manager role + manual invoice foundation.
--
-- We keep the underlying table name `clients` to avoid rewriting every RLS
-- policy and FK. In the UI + TypeScript we now call them "Estates".
--
-- Additions:
--   * estate_category enum (Retail / MCST / SBS)
--   * clients.category — defaults to 'MCST', so every existing row migrates
--   * user_role gains 'manager'
--   * invoices.client_id and invoices.category — for manual invoices that
--     aren't tied to a ticket
--   * invoices.ticket_id becomes nullable (manual invoices don't have one)
--   * is_360_staff() now includes 'manager' so managers get the same read
--     access on ticket-related history/attachments/comments as technicians
-- =============================================================================

-- 1. Estate category enum -----------------------------------------------------
create type estate_category as enum ('Retail', 'MCST', 'SBS');

-- 2. clients.category (default MCST — all existing rows inherit it) -----------
alter table clients
  add column if not exists category estate_category not null default 'MCST';

-- 3. Manager role -------------------------------------------------------------
alter type user_role add value if not exists 'manager';

-- 4. Manual-invoice support: invoices gains client_id + category,
--    and ticket_id becomes optional.
alter table invoices
  add column if not exists client_id uuid references clients(id) on delete set null,
  add column if not exists category  estate_category;

alter table invoices alter column ticket_id drop not null;

-- Was unique per ticket. Keep unique on non-null ticket_id (partial unique) so
-- a ticket still can't have two invoices, but manual invoices (ticket_id null)
-- can coexist freely.
alter table invoices drop constraint if exists invoices_ticket_id_key;
create unique index if not exists invoices_ticket_id_uniq
  on invoices (ticket_id) where ticket_id is not null;

-- NOTE: broadening is_360_staff() to include 'manager' happens in patch 12,
-- because Postgres won't let the same transaction add an enum value AND use
-- it in a function body.


-- =============================================================================
-- PATCH 12
-- =============================================================================
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


-- =============================================================================
-- PATCH 13
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #13
-- Run this in Supabase SQL Editor.
--
-- Backfills existing ticket-based invoices with the estate's client_id and
-- category, so the /admin/invoices filters and sub-menus work uniformly.
-- Idempotent: only touches invoices where the columns are still null.
-- =============================================================================

update invoices i
   set client_id = t.client_id,
       category  = c.category
  from tickets t
  join clients c on c.id = t.client_id
 where i.ticket_id = t.id
   and (i.client_id is null or i.category is null);


-- =============================================================================
-- PATCH 14
-- =============================================================================
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


-- =============================================================================
-- PATCH 15
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #15
-- Run this in Supabase SQL Editor.
--
-- Opens the technician portal to managers + lets both tech and manager
-- generate manual invoices (invoices with ticket_id = null).
--
--   * Managers can SELECT all tickets, all invoices, and all invoice_items
--     (mirror of the admin read policies, but read-only).
--   * Technicians and Managers can INSERT invoices where ticket_id is null
--     and created_by = auth.uid() — i.e. their own manual invoices.
--   * Technicians and Managers can INSERT invoice_items for those invoices.
--   * Technicians can also SELECT their own manual invoices (invoices where
--     ticket_id is null and created_by = auth.uid()).
-- =============================================================================

-- ------ Managers: read everything --------------------------------------------
drop policy if exists tickets_manager_read       on tickets;
create policy tickets_manager_read on tickets
  for select to authenticated
  using (auth_role() = 'manager');

drop policy if exists invoices_manager_read      on invoices;
create policy invoices_manager_read on invoices
  for select to authenticated
  using (auth_role() = 'manager');

drop policy if exists items_manager_read         on invoice_items;
create policy items_manager_read on invoice_items
  for select to authenticated
  using (auth_role() = 'manager');

-- ------ Manual invoice: insert allowed for tech/admin/manager ----------------
drop policy if exists invoices_manual_write      on invoices;
create policy invoices_manual_write on invoices
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and ticket_id is null
    and auth_role() in ('technician', 'manager', 'admin')
  );

drop policy if exists items_manual_write         on invoice_items;
create policy items_manual_write on invoice_items
  for insert to authenticated
  with check (
    exists (
      select 1 from invoices i
      where i.id = invoice_items.invoice_id
        and i.created_by = auth.uid()
        and i.ticket_id is null
    )
  );

-- ------ Techs: read their own manual invoices --------------------------------
drop policy if exists invoices_tech_read_manual  on invoices;
create policy invoices_tech_read_manual on invoices
  for select to authenticated
  using (
    auth_role() = 'technician'
    and ticket_id is null
    and created_by = auth.uid()
  );

drop policy if exists items_tech_read_manual     on invoice_items;
create policy items_tech_read_manual on invoice_items
  for select to authenticated
  using (
    exists (
      select 1 from invoices i
      where i.id = invoice_items.invoice_id
        and i.ticket_id is null
        and i.created_by = auth.uid()
    )
  );


-- =============================================================================
-- PATCH 16
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #16
-- Run this in Supabase SQL Editor.
--
-- Adds scheduled-visit fields to tickets so admin (and eventually technicians)
-- can pin a specific date + time when the tech is going to show up. Powers the
-- new Calendar view and the "Scheduled for …" line on the requester tracking
-- page.
--
-- RLS stays as-is: whoever can UPDATE a ticket via the existing policies
-- (admin all, tech on assigned) can also set scheduled_at.
-- =============================================================================

alter table tickets
  add column if not exists scheduled_at timestamptz,
  add column if not exists scheduled_duration_minutes int not null default 60;

create index if not exists tickets_scheduled_at_idx on tickets (scheduled_at)
  where scheduled_at is not null;


-- =============================================================================
-- PATCH 17
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #17
-- Run this in Supabase SQL Editor.
--
-- Fixes: when admin assigns a ticket to a technician, the tech's page didn't
-- update live. Root cause was two-fold:
--
--   (1) Postgres REPLICA IDENTITY on `tickets` was the default (primary key
--       only). Supabase Realtime needs REPLICA IDENTITY FULL to see BOTH the
--       old and new row images. Without both, RLS checks on UPDATE events
--       can silently drop the event for a user whose visibility just changed
--       (which is exactly what happens when assigned_to flips from NULL/other
--       to the technician themselves).
--
--   (2) Managers had SELECT on tickets but no UPDATE — they couldn't help
--       techs by moving a ticket forward. We add the same restricted UPDATE
--       policy technicians have.
--
-- Also does the same REPLICA IDENTITY FULL on the child tables that drive the
-- live timeline / attachments so their events aren't dropped either.
-- =============================================================================

-- ------ 1. Full replica identity so Realtime + RLS behave --------------------
alter table tickets                  replica identity full;
alter table ticket_status_history    replica identity full;
alter table ticket_attachments       replica identity full;
alter table ticket_comments          replica identity full;

-- ------ 2. Managers can update tickets (same rules as tech) ------------------
drop policy if exists tickets_manager_update on tickets;
create policy tickets_manager_update on tickets
  for update to authenticated
  using (auth_role() = 'manager')
  with check (
    auth_role() = 'manager'
    and status in ('assigned','in_progress','on_hold','resolved')
  );

-- ------ 3. Managers can insert attachments + comments on any ticket ---------
drop policy if exists attachments_manager_insert on ticket_attachments;
create policy attachments_manager_insert on ticket_attachments
  for insert to authenticated
  with check (
    auth_role() = 'manager'
    and uploaded_by = auth.uid()
  );

drop policy if exists comments_manager_insert on ticket_comments;
create policy comments_manager_insert on ticket_comments
  for insert to authenticated
  with check (
    auth_role() = 'manager'
    and author_id = auth.uid()
  );

-- ------ 4. Reload PostgREST schema cache so new policies apply now -----------
notify pgrst, 'reload schema';


-- =============================================================================
-- PATCH 18
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #18
-- Adds two new document types:
--   * quotations       — clone of invoices minus signature/stamp
--   * service_reports  — FM Division Service Report (fillable A4 form)
-- =============================================================================

-- ---------- QUOTATIONS -------------------------------------------------------
create sequence if not exists quotation_number_seq start 1;

create or replace function generate_quotation_number()
returns text language plpgsql as $$
declare v bigint;
begin
  v := nextval('quotation_number_seq');
  return 'QUO-' || to_char(now(), 'YYYY') || '-' || lpad(v::text, 6, '0');
end;
$$;

create table if not exists quotations (
  id                uuid primary key default gen_random_uuid(),
  quotation_no      text not null unique default generate_quotation_number(),
  ticket_id         uuid references tickets(id) on delete set null,
  client_id         uuid references clients(id) on delete set null,
  category          text,                     -- 'Retail' | 'MCST' | 'SBS'
  created_by        uuid references profiles(id) on delete set null,
  customer_name     text not null,
  customer_address  text,
  contact_no        text,
  quotation_date    date not null default current_date,
  valid_until       date,
  subtotal          numeric(12,2) not null default 0,
  discount          numeric(12,2) not null default 0,
  gst_amount        numeric(12,2) not null default 0,
  grand_total       numeric(12,2) not null default 0,
  notes             text,
  before_photo_paths text[] default '{}'::text[],
  after_photo_paths  text[] default '{}'::text[],
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists quotations_client_idx on quotations (client_id);
create index if not exists quotations_created_by_idx on quotations (created_by);
create index if not exists quotations_category_idx on quotations (category);

create table if not exists quotation_items (
  id            uuid primary key default gen_random_uuid(),
  quotation_id  uuid not null references quotations(id) on delete cascade,
  description   text not null,
  unit_price    numeric(12,2) not null default 0,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists quotation_items_q_idx on quotation_items (quotation_id, sort_order);

drop trigger if exists trg_quotations_updated on quotations;
create trigger trg_quotations_updated before update on quotations
  for each row execute function set_updated_at();

alter table quotations       enable row level security;
alter table quotation_items  enable row level security;

drop policy if exists quotations_admin_all      on quotations;
drop policy if exists quotations_staff_read     on quotations;
drop policy if exists quotations_staff_insert   on quotations;
drop policy if exists q_items_admin_all         on quotation_items;
drop policy if exists q_items_staff_read        on quotation_items;
drop policy if exists q_items_staff_insert      on quotation_items;

create policy quotations_admin_all on quotations
  for all to authenticated
  using (is_360_admin()) with check (is_360_admin());

create policy quotations_staff_read on quotations
  for select to authenticated
  using (auth_role() in ('technician','manager'));

create policy quotations_staff_insert on quotations
  for insert to authenticated
  with check (created_by = auth.uid() and auth_role() in ('technician','manager','admin'));

create policy q_items_admin_all on quotation_items
  for all to authenticated
  using (is_360_admin()) with check (is_360_admin());

create policy q_items_staff_read on quotation_items
  for select to authenticated
  using (auth_role() in ('technician','manager','admin'));

create policy q_items_staff_insert on quotation_items
  for insert to authenticated
  with check (
    exists (select 1 from quotations q where q.id = quotation_items.quotation_id and q.created_by = auth.uid())
  );

alter publication supabase_realtime add table quotations;
alter publication supabase_realtime add table quotation_items;


-- ---------- SERVICE REPORTS --------------------------------------------------
create sequence if not exists service_report_number_seq start 1;

create or replace function generate_service_report_number()
returns text language plpgsql as $$
declare v bigint;
begin
  v := nextval('service_report_number_seq');
  return 'SR-' || to_char(now(), 'YYYY') || '-' || lpad(v::text, 6, '0');
end;
$$;

create table if not exists service_reports (
  id                    uuid primary key default gen_random_uuid(),
  sr_no                 text not null unique default generate_service_report_number(),
  ticket_id             uuid references tickets(id) on delete set null,
  client_id             uuid references clients(id) on delete set null,
  created_by            uuid references profiles(id) on delete set null,
  -- Project / contact
  project_name          text not null,
  service_address       text,
  contact_person        text,
  contact_no            text,
  -- Booleans (checkboxes on the form)
  is_term_agreement     boolean not null default false,
  is_on_call            boolean not null default false,
  is_contract           boolean not null default false,
  is_chargeable         boolean not null default false,
  -- Service rendered (multiple can be true)
  svc_electrical        boolean not null default false,
  svc_plumbing          boolean not null default false,
  svc_generator         boolean not null default false,
  svc_pump              boolean not null default false,
  svc_fire_panel        boolean not null default false,
  svc_intercom          boolean not null default false,
  svc_cctv              boolean not null default false,
  svc_lighting          boolean not null default false,
  svc_auto_door         boolean not null default false,
  svc_others            text,
  -- Long text boxes
  work_description      text,
  recommendation        text,
  -- Sign off
  customer_name         text,
  customer_signature_path text,
  service_attended_by   text,
  date_attended         date,
  time_in               text,
  time_out              text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists service_reports_client_idx on service_reports (client_id);
create index if not exists service_reports_created_by_idx on service_reports (created_by);

drop trigger if exists trg_service_reports_updated on service_reports;
create trigger trg_service_reports_updated before update on service_reports
  for each row execute function set_updated_at();

alter table service_reports enable row level security;

drop policy if exists sr_admin_all    on service_reports;
drop policy if exists sr_staff_read   on service_reports;
drop policy if exists sr_staff_insert on service_reports;

create policy sr_admin_all on service_reports
  for all to authenticated
  using (is_360_admin()) with check (is_360_admin());

create policy sr_staff_read on service_reports
  for select to authenticated
  using (auth_role() in ('technician','manager','admin'));

create policy sr_staff_insert on service_reports
  for insert to authenticated
  with check (created_by = auth.uid() and auth_role() in ('technician','manager','admin'));

alter publication supabase_realtime add table service_reports;

notify pgrst, 'reload schema';


-- =============================================================================
-- PATCH 19
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #19
-- Adds an optional `unit_number` field to tickets so requesters can capture
-- e.g. "#06-11, Blk 71-A" separately from the free-text "specific_area".
-- =============================================================================

alter table tickets
  add column if not exists unit_number text;

notify pgrst, 'reload schema';


-- =============================================================================
-- PATCH 20
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #20
-- Customer feedback on resolved tickets.
--   * 1-5 star rating + optional comment
--   * one row per ticket (unique constraint)
--   * final once submitted — no updates
-- =============================================================================

create table if not exists ticket_feedback (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid not null unique references tickets(id) on delete cascade,
  rating         int  not null check (rating between 1 and 5),
  would_recommend boolean,
  comment        text,
  submitted_by   uuid references profiles(id) on delete set null,
  submitted_via  text not null default 'app'
                 check (submitted_via in ('app','public-link','tracking-token')),
  created_at     timestamptz not null default now()
);

create index if not exists ticket_feedback_ticket_idx on ticket_feedback (ticket_id);
create index if not exists ticket_feedback_created_idx on ticket_feedback (created_at desc);
create index if not exists ticket_feedback_rating_idx on ticket_feedback (rating);

-- Row-level security ---------------------------------------------------------
alter table ticket_feedback enable row level security;

drop policy if exists fb_admin_all       on ticket_feedback;
drop policy if exists fb_manager_read    on ticket_feedback;
drop policy if exists fb_tech_read_own   on ticket_feedback;
drop policy if exists fb_requester_read  on ticket_feedback;
drop policy if exists fb_requester_write on ticket_feedback;

-- Admin: full access
create policy fb_admin_all on ticket_feedback
  for all to authenticated
  using (is_360_admin()) with check (is_360_admin());

-- Manager: read all
create policy fb_manager_read on ticket_feedback
  for select to authenticated
  using (auth_role() = 'manager');

-- Technician: read only feedback on tickets assigned to them
create policy fb_tech_read_own on ticket_feedback
  for select to authenticated
  using (
    auth_role() = 'technician'
    and exists (
      select 1 from tickets t
      where t.id = ticket_feedback.ticket_id
        and t.assigned_to = auth.uid()
    )
  );

-- Requester: read + insert feedback on their own tickets
create policy fb_requester_read on ticket_feedback
  for select to authenticated
  using (
    auth_role() = 'requester'
    and exists (
      select 1 from tickets t
      where t.id = ticket_feedback.ticket_id
        and t.raised_by = auth.uid()
    )
  );

create policy fb_requester_write on ticket_feedback
  for insert to authenticated
  with check (
    auth_role() = 'requester'
    and submitted_by = auth.uid()
    and exists (
      select 1 from tickets t
      where t.id = ticket_feedback.ticket_id
        and t.raised_by = auth.uid()
        and t.status in ('resolved','closed')
    )
  );

-- Realtime so admin/manager dashboards react on new feedback
do $$ begin
  alter publication supabase_realtime add table ticket_feedback;
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';


-- =============================================================================
-- PATCH 21
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #21
-- Fixes: "Cannot coerce the result to a single JSON object" when technician /
-- manager tries to update a quotation or service report they created.
--
-- Root cause: v2_patch_18 gave them INSERT + SELECT but not UPDATE / DELETE,
-- so the UPDATE returned 0 rows and .single() blew up.
-- =============================================================================

-- ---------- Quotations: staff can update / delete their own -----------------
drop policy if exists quotations_staff_update  on quotations;
drop policy if exists quotations_staff_delete  on quotations;

create policy quotations_staff_update on quotations
  for update to authenticated
  using (
    auth_role() in ('technician', 'manager', 'admin')
    and created_by = auth.uid()
  )
  with check (
    auth_role() in ('technician', 'manager', 'admin')
    and created_by = auth.uid()
  );

create policy quotations_staff_delete on quotations
  for delete to authenticated
  using (
    auth_role() in ('technician', 'manager', 'admin')
    and created_by = auth.uid()
  );

-- ---------- Quotation items: staff can update / delete on own quotations ----
drop policy if exists q_items_staff_update  on quotation_items;
drop policy if exists q_items_staff_delete  on quotation_items;

create policy q_items_staff_update on quotation_items
  for update to authenticated
  using (
    exists (
      select 1 from quotations q
      where q.id = quotation_items.quotation_id
        and q.created_by = auth.uid()
    )
  );

create policy q_items_staff_delete on quotation_items
  for delete to authenticated
  using (
    exists (
      select 1 from quotations q
      where q.id = quotation_items.quotation_id
        and q.created_by = auth.uid()
    )
  );

-- ---------- Service reports: staff can update / delete their own ------------
drop policy if exists sr_staff_update  on service_reports;
drop policy if exists sr_staff_delete  on service_reports;

create policy sr_staff_update on service_reports
  for update to authenticated
  using (
    auth_role() in ('technician', 'manager', 'admin')
    and created_by = auth.uid()
  )
  with check (
    auth_role() in ('technician', 'manager', 'admin')
    and created_by = auth.uid()
  );

create policy sr_staff_delete on service_reports
  for delete to authenticated
  using (
    auth_role() in ('technician', 'manager', 'admin')
    and created_by = auth.uid()
  );

notify pgrst, 'reload schema';


-- =============================================================================
-- PATCH 22
-- =============================================================================
-- =============================================================================
-- 360 Integrated — v2 patch #22
-- Adds Edit + Preview capability to Invoices by granting UPDATE on invoices
-- and invoice_items to the creator (admin already has full access via _all).
-- =============================================================================

-- ---------- Invoices: creator can update/delete their own ------------------
drop policy if exists invoices_creator_update on invoices;
drop policy if exists invoices_creator_delete on invoices;

create policy invoices_creator_update on invoices
  for update to authenticated
  using (
    auth_role() in ('technician', 'manager', 'admin')
    and created_by = auth.uid()
  )
  with check (
    auth_role() in ('technician', 'manager', 'admin')
    and created_by = auth.uid()
  );

create policy invoices_creator_delete on invoices
  for delete to authenticated
  using (
    auth_role() in ('technician', 'manager', 'admin')
    and created_by = auth.uid()
  );

-- ---------- Invoice items: creator can update/delete on own invoices -------
drop policy if exists items_creator_update on invoice_items;
drop policy if exists items_creator_delete on invoice_items;

create policy items_creator_update on invoice_items
  for update to authenticated
  using (
    exists (
      select 1 from invoices i
      where i.id = invoice_items.invoice_id
        and i.created_by = auth.uid()
    )
  );

create policy items_creator_delete on invoice_items
  for delete to authenticated
  using (
    exists (
      select 1 from invoices i
      where i.id = invoice_items.invoice_id
        and i.created_by = auth.uid()
    )
  );

notify pgrst, 'reload schema';


-- =============================================================================
-- PATCH 23
-- =============================================================================
-- =============================================================================
-- v2 patch #23 — allow anonymous requesters to submit feedback via their
-- tracking_token, and let anyone view feedback linked to a ticket by token.
--
-- Feedback for signed-in requesters was already covered in patch #20.
-- The public track page (/track/[token]) has no session, so we use a
-- server action that runs on the SERVICE-ROLE client and validates the
-- token → ticket_id match server-side. No RLS change is required for the
-- service-role client (it bypasses RLS). This patch only ensures the token
-- lookup is fast.
-- =============================================================================

create index if not exists tickets_tracking_token_idx
  on tickets (tracking_token)
  where tracking_token is not null;

-- Also allow the "public-link" enum for submitted_via so the action can
-- stamp feedback rows correctly (this value was already permitted by the
-- table check constraint added in patch #20; nothing to do here — just
-- documenting).

notify pgrst, 'reload schema';


-- =============================================================================
-- PATCH 24
-- =============================================================================
-- =============================================================================
-- v2 patch #24 — Company branding settings.
-- A single-row `company_settings` table + `company-assets` storage bucket for
-- the admin-uploaded logo/stamp. Text fields cover company name/address/UEN/
-- contact/GST + T&C bullets used across Invoice, Quotation, Service Report.
--
-- The default row is inserted so PDFs still render before the admin touches
-- anything. `singleton_lock` CHECK ensures only one row can exist.
-- =============================================================================

create table if not exists company_settings (
  id                   uuid primary key default gen_random_uuid(),
  singleton_lock       boolean not null default true unique,
  -- Images (storage paths inside `company-assets` bucket)
  logo_path            text,
  stamp_path           text,
  -- Company header text
  company_name         text not null default '360 INTEGRATED FM & SM PTE. LTD.',
  tagline              text default 'Facilities Management & Strata Management is our Key',
  uen                  text not null default '202212959Z',
  gst_reg              text default '202212959Z',
  -- Contact
  address_line         text default '71 Bukit Batok Cres #06-11 Prestige Centre, Singapore 658071',
  phone_office         text default '6677 0360',
  phone_hotline        text default '8757 3360 / 8758 3360',
  phone_whatsapp       text default '8757 3360 / 9340 1360',
  email                text default 'support@360maintenance.sg',
  website              text default 'www.360maintenance.sg',
  badges_line          text default 'bizSAFE · STR · LAS · TOP Prestige 100',
  -- Editable T&C (one bullet per line)
  invoice_terms        text default $tc$30% deposit payable upon confirmation of works order
Balance amount payable upon completion of works order
Deposit non-refundable if order cancelled after confirmation
Goods delivered are not returnable & sold are not exchangeable$tc$,
  quotation_terms      text default $tc$This quotation is valid for 30 days from the date of issue.
30% deposit payable upon confirmation of works order.
Balance amount payable upon completion of works order.
Prices subject to change without prior notice after validity period.$tc$,
  -- Payment
  paynow_text          text default 'Paynow UEN 202212959Z',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint company_settings_singleton check (singleton_lock = true)
);

-- Ensure at most one row (the singleton_lock unique constraint on `true` value
-- + the CHECK guarantee this).

-- Seed the default row if none exists.
insert into company_settings (singleton_lock)
select true
where not exists (select 1 from company_settings);

-- Updated-at trigger
drop trigger if exists trg_company_settings_updated on company_settings;
create trigger trg_company_settings_updated before update on company_settings
  for each row execute function set_updated_at();

-- RLS: admin full access; everyone signed-in can read (needed for PDF renderer
-- server routes to fetch settings before generating).
alter table company_settings enable row level security;

drop policy if exists company_settings_admin_all on company_settings;
drop policy if exists company_settings_read      on company_settings;

create policy company_settings_admin_all on company_settings
  for all to authenticated
  using (is_360_admin()) with check (is_360_admin());

create policy company_settings_read on company_settings
  for select to authenticated
  using (true);

-- Storage bucket for uploaded branding images.
-- Create manually in Storage → New bucket → name "company-assets" if it does
-- not exist. Public read so PDFs can fetch the logo/stamp signed URLs quickly.
-- Storage policies:
--   * any authenticated user can read
--   * only admin can write

drop policy if exists "company-assets read"  on storage.objects;
drop policy if exists "company-assets write" on storage.objects;

create policy "company-assets read"
  on storage.objects for select to authenticated
  using (bucket_id = 'company-assets');

create policy "company-assets write"
  on storage.objects for all to authenticated
  using  (bucket_id = 'company-assets' and is_360_admin())
  with check (bucket_id = 'company-assets' and is_360_admin());

notify pgrst, 'reload schema';


-- =============================================================================
-- PATCH 25
-- =============================================================================
-- =============================================================================
-- v2 patch #25 — dark-mode logo variant.
-- Adds a second logo column so admin can upload a version tailored for the
-- dark-mode UI. All existing PDFs still use the light-mode logo; the dark
-- variant is only used by the app chrome (sidebar, header, login, etc.).
-- =============================================================================

alter table company_settings
  add column if not exists logo_dark_path text;

notify pgrst, 'reload schema';

