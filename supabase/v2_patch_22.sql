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
