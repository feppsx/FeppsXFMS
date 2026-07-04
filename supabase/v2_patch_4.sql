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
