-- =============================================================================
-- FeppsXFMS — v3 patch #3
-- Removes the "360 INTEGRATED FM & SM PTE. LTD." default from
-- company_settings.company_name. New customer orgs shouldn't inherit that
-- brand string; they'll fill it in via the Branding page (or the
-- createOrganization server action seeds it with the org's own name).
-- =============================================================================

alter table company_settings alter column company_name drop default;
alter table company_settings alter column company_name set default '';

-- Reset the seed 360 Integrated org's existing company_settings row so it
-- reads the org's real name instead of the old hardcoded FM & SM branding.
update company_settings
  set company_name = '360 Integrated'
where organization_id = '00000000-0000-0000-0000-000000000360'
  and company_name in ('360 INTEGRATED FM & SM PTE. LTD.', '');

notify pgrst, 'reload schema';
