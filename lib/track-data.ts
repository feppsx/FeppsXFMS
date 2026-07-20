// Server helper for the public /track/[token] page.
// Uses the SERVICE-ROLE Supabase client so we can join through profiles
// (for the assignee's name) without opening SELECT on them to the anon role.
// The tracking_token is the auth: only ticket rows whose token matches are
// ever loaded, so a token holder can only ever see their own ticket.

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Ticket, TicketAttachment, TicketStatusHistoryRow,
} from "@/lib/db-types";

export interface PublicTicketView extends Ticket {
  client: { name: string; location: string } | null;
  tenant: { name: string } | null;
  category: { name: string; color: string } | null;
  assignee: { full_name: string } | null;
}

export interface TrackBundle {
  ticket: PublicTicketView;
  history: TicketStatusHistoryRow[];
  attachments: (TicketAttachment & { signed_url: string | null })[];
}

/** Returns null if no ticket matches the tracking token. */
export async function getTicketByToken(token: string): Promise<TrackBundle | null> {
  const admin = createAdminClient();

  const { data: ticket } = await admin
    .from("tickets")
    .select(`
      *,
      client:clients(name, location),
      tenant:client_tenants(name),
      category:ticket_categories(name, color),
      assignee:profiles!tickets_assigned_to_fkey(full_name)
    `)
    .eq("tracking_token", token)
    .maybeSingle<PublicTicketView>();

  if (!ticket) return null;

  const [{ data: history }, { data: rawAttachments }] = await Promise.all([
    admin.from("ticket_status_history")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true })
      .returns<TicketStatusHistoryRow[]>(),
    admin.from("ticket_attachments")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true })
      .returns<TicketAttachment[]>(),
  ]);

  const attachments: (TicketAttachment & { signed_url: string | null })[] = [];
  for (const att of rawAttachments ?? []) {
    const { data: signed } = await admin.storage
      .from("ticket-attachments")
      .createSignedUrl(att.storage_path, 60 * 60);
    attachments.push({ ...att, signed_url: signed?.signedUrl ?? null });
  }

  return { ticket, history: history ?? [], attachments };
}


// -------- Feedback lookup (bypasses RLS via admin client) --------

export interface AnonTrackFeedback {
  rating: number;
  would_recommend: boolean | null;
  comment: string | null;
  created_at: string;
}

export async function getFeedbackByTicketId(ticketId: string): Promise<AnonTrackFeedback | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ticket_feedback")
    .select("rating, would_recommend, comment, created_at")
    .eq("ticket_id", ticketId)
    .maybeSingle<AnonTrackFeedback>();
  return data ?? null;
}
