-- =============================================================================
-- v2 patch #25 — dark-mode logo variant.
-- Adds a second logo column so admin can upload a version tailored for the
-- dark-mode UI. All existing PDFs still use the light-mode logo; the dark
-- variant is only used by the app chrome (sidebar, header, login, etc.).
-- =============================================================================

alter table company_settings
  add column if not exists logo_dark_path text;

notify pgrst, 'reload schema';
