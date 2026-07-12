-- =============================================================================
-- 360 Integrated — v2 patch #20
-- Customer feedback on resolved tickets.
--   * 1-5 star rating + optional comment
--   * one row per ticket (unique constraint)
--   * final once submitted — no updates
-- =============================================================================

create table if not exists ticket_feedback (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid not null unique references tickets(id) on delete cascade,
  rating         int  not null check (rating between 1 and 5),
  would_recommend boolean,
  comment        text,
  submitted_by   uuid references profiles(id) on delete set null,
  submitted_via  text not null default 'app'
                 check (submitted_via in ('app','public-link','tracking-token')),
  created_at     timestamptz not null default now()
);

create index if not exists ticket_feedback_ticket_idx on ticket_feedback (ticket_id);
create index if not exists ticket_feedback_created_idx on ticket_feedback (created_at desc);
create index if not exists ticket_feedback_rating_idx on ticket_feedback (rating);

-- Row-level security ---------------------------------------------------------
alter table ticket_feedback enable row level security;

drop policy if exists fb_admin_all       on ticket_feedback;
drop policy if exists fb_manager_read    on ticket_feedback;
drop policy if exists fb_tech_read_own   on ticket_feedback;
drop policy if exists fb_requester_read  on ticket_feedback;
drop policy if exists fb_requester_write on ticket_feedback;

-- Admin: full access
create policy fb_admin_all on ticket_feedback
  for all to authenticated
  using (is_360_admin()) with check (is_360_admin());

-- Manager: read all
create policy fb_manager_read on ticket_feedback
  for select to authenticated
  using (auth_role() = 'manager');

-- Technician: read only feedback on tickets assigned to them
create policy fb_tech_read_own on ticket_feedback
  for select to authenticated
  using (
    auth_role() = 'technician'
    and exists (
      select 1 from tickets t
      where t.id = ticket_feedback.ticket_id
        and t.assigned_to = auth.uid()
    )
  );

-- Requester: read + insert feedback on their own tickets
create policy fb_requester_read on ticket_feedback
  for select to authenticated
  using (
    auth_role() = 'requester'
    and exists (
      select 1 from tickets t
      where t.id = ticket_feedback.ticket_id
        and t.raised_by = auth.uid()
    )
  );

create policy fb_requester_write on ticket_feedback
  for insert to authenticated
  with check (
    auth_role() = 'requester'
    and submitted_by = auth.uid()
    and exists (
      select 1 from tickets t
      where t.id = ticket_feedback.ticket_id
        and t.raised_by = auth.uid()
        and t.status in ('resolved','closed')
    )
  );

-- Realtime so admin/manager dashboards react on new feedback
do $$ begin
  alter publication supabase_realtime add table ticket_feedback;
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
