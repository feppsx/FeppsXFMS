// Server helper: fetches scheduled tickets and shapes them for the calendar.
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/components/CalendarView";
import type { TicketStatus } from "@/lib/db-types";

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

/** Serialized shape that's safe to pass from server → client component. */
export interface SerializedEvent extends Omit<CalendarEvent, "start" | "end"> {
  startIso: string;
  endIso: string;
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

/** Client-side helper: convert the serialized events back to Date-bearing ones. */
export function eventsWithDates(serialized: SerializedEvent[]): CalendarEvent[] {
  return serialized.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    ticket_number: e.ticket_number,
    client_name: e.client_name,
    assignee_name: e.assignee_name,
    start: new Date(e.startIso),
    end:   new Date(e.endIso),
  }));
}
