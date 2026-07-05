// Shared server helper — fetch full detail for one ticket (used by all 3 roles).
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Ticket, TicketAttachment, TicketComment, TicketStatusHistoryRow,
} from "@/lib/db-types";

export interface TicketWithRelations extends Ticket {
  client: { id: string; name: string; location: string } | null;
  tenant: { id: string; name: string } | null;
  category: { id: string; name: string; color: string } | null;
  raiser: { id: string; full_name: string } | null;
  assignee: { id: string; full_name: string; signature_path: string | null } | null;
}

export async function getTicketDetail(ticketId: string) {
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select(`
      *,
      client:clients(id, name, location),
      tenant:client_tenants(id, name),
      category:ticket_categories(id, name, color),
      raiser:profiles!tickets_raised_by_fkey(id, full_name),
      assignee:profiles!tickets_assigned_to_fkey(id, full_name, signature_path)
    `)
    .eq("id", ticketId)
    .maybeSingle<TicketWithRelations>();

  if (!ticket) notFound();

  const [{ data: history }, { data: attachments }, { data: comments }] = await Promise.all([
    supabase.from("ticket_status_history").select("*").eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }).returns<TicketStatusHistoryRow[]>(),
    supabase.from("ticket_attachments").select("*").eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }).returns<TicketAttachment[]>(),
    supabase.from("ticket_comments").select("*").eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }).returns<TicketComment[]>(),
  ]);

  const actorIds = Array.from(new Set([
    ...((history ?? []).map((h) => h.changed_by).filter(Boolean) as string[]),
    ...((comments ?? []).map((c) => c.author_id).filter(Boolean) as string[]),
  ]));
  let actors: Record<string, string> = {};
  if (actorIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
    actors = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  }

  const urls: Record<string, string> = {};
  for (const att of attachments ?? []) {
    const { data: signed } = await supabase.storage
      .from("ticket-attachments").createSignedUrl(att.storage_path, 60 * 60);
    if (signed?.signedUrl) urls[att.id] = signed.signedUrl;
  }

  return {
    ticket,
    history: history ?? [],
    attachments: attachments ?? [],
    comments: comments ?? [],
    actors,
    urls,
  };
}
