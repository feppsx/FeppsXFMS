-- =============================================================================
-- 360 Integrated — Facility Ticketing System
-- 03_seed.sql  |  Baseline lookup data
-- Run this AFTER 02_rls_policies.sql.
--
-- Note: this file seeds ORG + BUILDING + CATEGORY data only.
-- Test users must be created via Supabase Auth (see SETUP.md → Step 5),
-- because auth.users is managed by Supabase and rows can't just be INSERTed here.
-- =============================================================================

-- Categories -----------------------------------------------------------------
insert into ticket_categories (name, description) values
  ('Electrical',      'Lighting, power sockets, wiring, breakers'),
  ('Plumbing',        'Leaks, blockages, taps, toilets, water supply'),
  ('HVAC / Aircon',   'Air conditioning, ventilation, heating'),
  ('Lift / Elevator', 'Lift faults, alarms, maintenance'),
  ('Cleaning',        'Cleaning requests and spills'),
  ('Security',        'Access cards, CCTV, alarms, locks'),
  ('Carpentry',       'Doors, windows, furniture, partitions'),
  ('Pest Control',    'Pest sightings and treatment'),
  ('General',         'Anything not covered above')
on conflict (name) do nothing;

-- Client organizations -------------------------------------------------------
insert into organizations (name, contact_email, contact_phone) values
  ('Prestige Centre',    'ops@prestigecentre.example',    '+65 6100 0001'),
  ('Lam Soon Building',  'ops@lamsoon.example',           '+65 6100 0002')
on conflict (name) do nothing;

-- Buildings ------------------------------------------------------------------
insert into buildings (organization_id, name, address)
select o.id, b.name, b.address
from organizations o
join (values
  ('Prestige Centre',   'Prestige Centre Main Tower', '1 Prestige Road, Singapore'),
  ('Prestige Centre',   'Prestige Centre Annex',      '1A Prestige Road, Singapore'),
  ('Lam Soon Building', 'Lam Soon Main',              '63 Hillview Ave, Singapore')
) as b(org_name, name, address) on b.org_name = o.name
on conflict (organization_id, name) do nothing;
