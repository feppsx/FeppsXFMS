-- =============================================================================
-- 360 Integrated — v2 patch #10
-- Run this in Supabase SQL Editor.
--
-- Enables the anonymous QR/link ticket flow.
--   * Adds contact fields + a random tracking_token to tickets
--   * Makes raised_by nullable (anonymous tickets have no linked profile)
--   * Auto-generates a friendly 8-char tracking token like "TRK-A3B4C5D6"
--   * Opens SELECT on active clients/tenants/categories to the anon role
--     (needed for the public form's dropdowns to work)
--   * Opens INSERT on the ticket-attachments storage bucket to anon under
--     the tickets/new/ prefix (needed for client-side photo uploads)
--   * All ticket INSERT and read-by-token operations still happen server-side
--     via the service-role key so the tracking token stays the "auth."
-- =============================================================================

-- 1. New columns on tickets ---------------------------------------------------

alter table tickets
  add column if not exists requester_name  text,
  add column if not exists requester_email text,
  add column if not exists requester_phone text,
  add column if not exists tracking_token  text unique;

alter table tickets alter column raised_by drop not null;

create index if not exists tickets_tracking_token_idx on tickets (tracking_token);

-- 2. Tracking-token generator (avoids ambiguous chars: 0, O, 1, I, L) ---------

create or replace function generate_tracking_token()
returns text
language plpgsql
volatile
as $$
declare
  charset text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result  text := 'TRK-';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(charset, 1 + floor(random() * length(charset))::int, 1);
  end loop;
  return result;
end;
$$;

-- Auto-set tracking_token on insert, retrying on the astronomically-rare collision.
create or replace function set_tracking_token()
returns trigger
language plpgsql
as $$
begin
  if new.tracking_token is null then
    loop
      new.tracking_token := generate_tracking_token();
      exit when not exists (select 1 from tickets where tracking_token = new.tracking_token);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tickets_tracking_token on tickets;
create trigger trg_tickets_tracking_token
  before insert on tickets
  for each row execute function set_tracking_token();

-- 3. Anon SELECT on active reference tables (form dropdowns) ------------------

drop policy if exists categories_read_public on ticket_categories;
create policy categories_read_public on ticket_categories
  for select to anon using (is_active = true);

drop policy if exists clients_read_public on clients;
create policy clients_read_public on clients
  for select to anon using (is_active = true);

drop policy if exists tenants_read_public on client_tenants;
create policy tenants_read_public on client_tenants
  for select to anon using (is_active = true);

-- 4. Anon INSERT into storage — only under tickets/new/* ---------------------

drop policy if exists "ticket attachments anon upload" on storage.objects;
create policy "ticket attachments anon upload"
  on storage.objects
  for insert to anon
  with check (
    bucket_id = 'ticket-attachments'
    and (storage.foldername(name))[1] = 'tickets'
    and (storage.foldername(name))[2] = 'new'
  );
