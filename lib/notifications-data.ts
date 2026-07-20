// Notifications feed — synthesises recent events from ticket_status_history
// and ticket_feedback, filtered by RLS so each user sees what they should.
import { createClient } from "@/lib/supabase/server";

export interface NotifItem {
  id: string;
  when: string;              // ISO
  kind: "status" | "feedback" | "assignment";
  headline: string;
  detail?: string;
  href?: string;
}

export async function getNotifications(limit = 30): Promise<NotifItem[]> {
  const supabase = await createClient();

  const [{ data: history }, { data: feedback }] = await Promise.all([
    supabase
      .from("ticket_status_history")
      .select("id, ticket_id, from_status, to_status, created_at, ticket:tickets(ticket_number, title)")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("ticket_feedback")
      .select("id, ticket_id, rating, comment, created_at, ticket:tickets(ticket_number, title)")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const rows: NotifItem[] = [];

  for (const h of ((history ?? []) as unknown) as Array<{
    id: string; ticket_id: string; from_status: string | null; to_status: string; created_at: string;
    ticket: { ticket_number: string; title: string } | null;
  }>) {
    const kind: NotifItem["kind"] = h.to_status === "assigned" ? "assignment" : "status";
    const label = h.to_status.replace("_", " ");
    rows.push({
      id: `s-${h.id}`,
      when: h.created_at,
      kind,
      headline: kind === "assignment"
        ? `Assigned: ${h.ticket?.ticket_number ?? ""}`
        : `Status → ${label}`,
      detail: h.ticket?.title ?? undefined,
      href: `/admin/tickets/${h.ticket_id}`,
    });
  }

  for (const f of ((feedback ?? []) as unknown) as Array<{
    id: string; ticket_id: string; rating: number; comment: string | null; created_at: string;
    ticket: { ticket_number: string; title: string } | null;
  }>) {
    rows.push({
      id: `f-${f.id}`,
      when: f.created_at,
      kind: "feedback",
      headline: `${f.rating}★ feedback on ${f.ticket?.ticket_number ?? ""}`,
      detail: f.comment ?? f.ticket?.title ?? undefined,
      href: `/admin/tickets/${f.ticket_id}`,
    });
  }

  rows.sort((a, b) => (a.when < b.when ? 1 : -1));
  return rows.slice(0, limit);
}
