// Client-safe types + hydrator. Kept out of calendar-data.ts (which pulls in
// next/headers via the server Supabase client) so client components can
// import without dragging in server-only code.

import type { CalendarEvent } from "@/components/CalendarView";

/** Serialized shape passed from server → client component. */
export interface SerializedEvent extends Omit<CalendarEvent, "start" | "end"> {
  startIso: string;
  endIso: string;
}

/** Convert serialized events back to Date-bearing ones on the client. */
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
