"use client";

// Thin client wrapper that hydrates serialized events → Date-bearing ones
// and hands them to <CalendarView>. Imports only client-safe helpers.

import { CalendarView } from "./CalendarView";
import { eventsWithDates, type SerializedEvent } from "@/lib/calendar-types";

export function CalendarClient({
  events, ticketHrefBase,
}: {
  events: SerializedEvent[];
  ticketHrefBase: string;
}) {
  const hydrated = eventsWithDates(events);
  return <CalendarView events={hydrated} ticketHrefBase={ticketHrefBase} />;
}
