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
