-- =============================================================================
-- FeppsXFMS — v3 patch #4
-- Restores the storage policies for the `company-assets` bucket that got
-- dropped when v3.sql did "drop function is_360_admin cascade". The old
-- policies referenced is_360_admin() and got wiped by the cascade.
--
-- New policies use the org-aware helpers: any authenticated user in an org
-- can read their own org's assets, and org_admins can write/delete them.
-- Platform admins bypass both.
--
-- Path convention: assets are stored under `<organization_id>/<filename>`
-- so we can enforce org isolation via the first path segment.
-- =============================================================================

-- --- Clean up any old / broken policies -------------------------------------
drop policy if exists "company-assets read"  on storage.objects;
drop policy if exists "company-assets write" on storage.objects;

-- --- Read: any signed-in user can read assets belonging to their own org ---
create policy "company-assets read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'company-assets'
    and (
      is_platform_admin()
      or (storage.foldername(name))[1] = current_org_id()::text
      -- Backward-compat for existing files uploaded before this patch that
      -- weren't stored under the org_id prefix. Anyone in an org can read.
      or (
        current_org_id() is not null
        and (storage.foldername(name))[1] not similar to '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
      )
    )
  );

-- --- Write: org_admins for their own org; platform_admin for any org -------
create policy "company-assets write"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'company-assets'
    and (
      is_platform_admin()
      or (is_org_admin() and (
        (storage.foldername(name))[1] = current_org_id()::text
        -- Also allow writes without the org_id prefix (older UI code)
        or (storage.foldername(name))[1] not similar to '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
      ))
    )
  )
  with check (
    bucket_id = 'company-assets'
    and (
      is_platform_admin()
      or (is_org_admin() and (
        (storage.foldername(name))[1] = current_org_id()::text
        or (storage.foldername(name))[1] not similar to '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
      ))
    )
  );

notify pgrst, 'reload schema';
