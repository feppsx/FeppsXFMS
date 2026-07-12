import { createClient } from "@/lib/supabase/server";

export interface FeedbackListRow {
  id: string;
  rating: number;
  would_recommend: boolean | null;
  comment: string | null;
  created_at: string;
  ticket: {
    id: string;
    ticket_number: string;
    title: string;
    assigned_to: string | null;
    client_id: string | null;
    assignee_name: string | null;
    client_name: string | null;
  } | null;
}

export interface FeedbackListFilters {
  rating?: number;
  technicianId?: string;
  clientId?: string;
  from?: string;
  to?: string;
}

/** Feedback rows visible to the current user (RLS handles who can see what). */
export async function getFeedbackList(f: FeedbackListFilters = {}): Promise<FeedbackListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("ticket_feedback")
    .select(`
      id, rating, would_recommend, comment, created_at,
      ticket:tickets(
        id, ticket_number, title, assigned_to, client_id,
        assignee:profiles!tickets_assigned_to_fkey(full_name),
        client:clients(name)
      )
    `)
    .order("created_at", { ascending: false });

  if (f.rating) query = query.eq("rating", f.rating);
  if (f.from) query = query.gte("created_at", f.from);
  if (f.to) query = query.lte("created_at", f.to);

  const { data } = await query.limit(500);
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    rating: number;
    would_recommend: boolean | null;
    comment: string | null;
    created_at: string;
    ticket: {
      id: string;
      ticket_number: string;
      title: string;
      assigned_to: string | null;
      client_id: string | null;
      assignee: { full_name: string } | null;
      client: { name: string } | null;
    } | null;
  }>;

  let mapped: FeedbackListRow[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    would_recommend: r.would_recommend,
    comment: r.comment,
    created_at: r.created_at,
    ticket: r.ticket ? {
      id: r.ticket.id,
      ticket_number: r.ticket.ticket_number,
      title: r.ticket.title,
      assigned_to: r.ticket.assigned_to,
      client_id: r.ticket.client_id,
      assignee_name: r.ticket.assignee?.full_name ?? null,
      client_name: r.ticket.client?.name ?? null,
    } : null,
  }));

  if (f.technicianId) mapped = mapped.filter((r) => r.ticket?.assigned_to === f.technicianId);
  if (f.clientId)     mapped = mapped.filter((r) => r.ticket?.client_id === f.clientId);
  return mapped;
}

/** For technician's My ratings page — RLS already limits to their own tickets. */
export async function getMyRatingsSummary(): Promise<{ avg: number | null; count: number; last: FeedbackListRow[] }> {
  const list = await getFeedbackList();
  if (list.length === 0) return { avg: null, count: 0, last: [] };
  const total = list.reduce((s, r) => s + r.rating, 0);
  return {
    avg: Math.round((total / list.length) * 10) / 10,
    count: list.length,
    last: list.slice(0, 20),
  };
}
