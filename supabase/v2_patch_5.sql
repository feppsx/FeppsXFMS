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
