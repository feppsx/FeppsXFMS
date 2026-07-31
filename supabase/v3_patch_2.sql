-- =============================================================================
-- FeppsXFMS — v3 patch #2
-- Auto-fill organization_id on insert.
--
-- After v3.sql, every insert needs to set organization_id. Rather than
-- touching ~14 server action files, we add a BEFORE-INSERT trigger to each
-- tenant table: if the incoming row has a NULL organization_id, we fill it
-- from current_org_id() (the caller's profile org).
--
-- Callers that DO supply organization_id (e.g. platform admin cross-org
-- inserts, or server actions using service_role) are unaffected — the
-- trigger only fires when the column is NULL.
--
-- RLS still enforces the caller-vs-row check with WITH CHECK, so a tenant
-- can't sneak in an org_id from another org.
-- =============================================================================

create or replace function fill_organization_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_org uuid;
begin
  if new.organization_id is not null then
    return new;
  end if;

  caller_org := current_org_id();
  if caller_org is null then
    -- Anon/public flow (no profile). Leave as NULL; the RLS/NOT-NULL
    -- constraint will reject — that's the correct behaviour for anon.
    return new;
  end if;

  new.organization_id := caller_org;
  return new;
end;
$$;

-- Attach the trigger to every tenant table.
do $$
declare
  t text;
  tables text[] := array[
    'profiles',
    'clients',
    'client_tenants',
    'ticket_categories',
    'technician_trades',
    'tickets',
    'ticket_status_history',
    'ticket_attachments',
    'ticket_comments',
    'ticket_feedback',
    'quotations',
    'quotation_items',
    'service_reports',
    'invoices',
    'invoice_items',
    'company_settings'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_fill_org_id on %I', t);
    execute format(
      'create trigger trg_fill_org_id
         before insert on %I
         for each row execute function fill_organization_id()',
      t
    );
  end loop;
end $$;

notify pgrst, 'reload schema';
