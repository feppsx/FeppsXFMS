"use client";

// Thin client wrapper that hydrates serialized events → Date-bearing events
// and hands them to <CalendarView>. Keeps CalendarView pure of hydration
// concerns.

import { CalendarView } from "./CalendarView";
import { eventsWithDates, type SerializedEvent } from "@/lib/calendar-data";

export function CalendarClient({
  events, ticketHrefBase,
}: {
  events: SerializedEvent[];
  ticketHrefBase: string;
}) {
  const hydrated = eventsWithDates(events);
  return <CalendarView events={hydrated} ticketHrefBase={ticketHrefBase} />;
}
