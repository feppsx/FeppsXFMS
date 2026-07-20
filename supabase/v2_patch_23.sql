-- =============================================================================
-- v2 patch #23 — allow anonymous requesters to submit feedback via their
-- tracking_token, and let anyone view feedback linked to a ticket by token.
--
-- Feedback for signed-in requesters was already covered in patch #20.
-- The public track page (/track/[token]) has no session, so we use a
-- server action that runs on the SERVICE-ROLE client and validates the
-- token → ticket_id match server-side. No RLS change is required for the
-- service-role client (it bypasses RLS). This patch only ensures the token
-- lookup is fast.
-- =============================================================================

create index if not exists tickets_tracking_token_idx
  on tickets (tracking_token)
  where tracking_token is not null;

-- Also allow the "public-link" enum for submitted_via so the action can
-- stamp feedback rows correctly (this value was already permitted by the
-- table check constraint added in patch #20; nothing to do here — just
-- documenting).

notify pgrst, 'reload schema';
