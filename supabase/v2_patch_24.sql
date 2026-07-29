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
