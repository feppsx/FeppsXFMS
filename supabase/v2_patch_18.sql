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
