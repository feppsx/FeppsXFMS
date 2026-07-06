// Server helper: fetches scheduled tickets and shapes them for the calendar.
import { createClient } from "@/lib/supabase/server";
import type { TicketStatus } from "@/lib/db-types";
import type { SerializedEvent } from "@/lib/calendar-types";

interface Row {
  id: string;
  ticket_number: string;
  title: string;
  status: TicketStatus;
  scheduled_at: string;
  scheduled_duration_minutes: number | null;
  client: { name: string } | null;
  assignee: { full_name: string } | null;
}

export async function getScheduledEvents(): Promise<SerializedEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select(`
      id, ticket_number, title, status, scheduled_at, scheduled_duration_minutes,
      client:clients(name),
      assignee:profiles!tickets_assigned_to_fkey(full_name)
    `)
    .not("scheduled_at", "is", null)
    .order("scheduled_at", { ascending: true })
    .returns<Row[]>();

  return (data ?? []).map((r) => {
    const start = new Date(r.scheduled_at);
    const durationMin = r.scheduled_duration_minutes ?? 60;
    const end = new Date(start.getTime() + durationMin * 60 * 1000);
    return {
      id: r.id,
      title: `${r.ticket_number} — ${r.title}`,
      status: r.status,
      ticket_number: r.ticket_number,
      client_name: r.client?.name ?? null,
      assignee_name: r.assignee?.full_name ?? null,
      startIso: start.toISOString(),
      endIso:   end.toISOString(),
    };
  });
}
