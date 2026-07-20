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
