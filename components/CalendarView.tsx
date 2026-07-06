"use client";

// Scheduled-visit calendar for admin + technician portals.
// Backed by react-big-calendar (Month / Week / Day / Agenda).
// Events represent tickets that have a `scheduled_at`.

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import type { TicketStatus } from "@/lib/db-types";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-GB": enGB };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export interface CalendarEvent {
  id: string;                // ticket id — used to route on click
  title: string;
  start: Date;
  end: Date;
  status: TicketStatus;
  ticket_number: string;
  client_name: string | null;
  assignee_name: string | null;
}

/** Palette per status. Applied via eventPropGetter — react-big-calendar
 *  fills the event chip using these inline styles. */
const STATUS_STYLE: Record<TicketStatus, { bg: string; fg: string; bd: string }> = {
  submitted:   { bg: "#f59e0b", fg: "#ffffff", bd: "#b45309" },   // amber
  assigned:    { bg: "#3b82f6", fg: "#ffffff", bd: "#1d4ed8" },   // blue
  in_progress: { bg: "#0f4c81", fg: "#ffffff", bd: "#0a355c" },   // brand
  on_hold:     { bg: "#94a3b8", fg: "#ffffff", bd: "#475569" },   // slate
  resolved:    { bg: "#10b981", fg: "#ffffff", bd: "#047857" },   // emerald
  closed:      { bg: "#a3a3a3", fg: "#ffffff", bd: "#525252" },   // neutral
  reopened:    { bg: "#f43f5e", fg: "#ffffff", bd: "#be123c" },   // rose
  cancelled:   { bg: "#e5e7eb", fg: "#525252", bd: "#a3a3a3" },   // grey
};

export function CalendarView({
  events, ticketHrefBase,
}: {
  events: CalendarEvent[];
  /** Where clicking an event should navigate to. */
  ticketHrefBase: string;    // e.g. "/admin/tickets" or "/technician/jobs"
}) {
  const router = useRouter();

  // react-big-calendar wants Date objects; we already deserialized in the caller.
  const parsed = useMemo(() => events, [events]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 shadow-card">
      <BigCalendar
        localizer={localizer}
        events={parsed}
        startAccessor="start"
        endAccessor="end"
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        defaultView={Views.MONTH}
        popup
        style={{ height: 680 }}
        onSelectEvent={(ev) => router.push(`${ticketHrefBase}/${(ev as CalendarEvent).id}`)}
        eventPropGetter={(ev) => {
          const s = STATUS_STYLE[(ev as CalendarEvent).status];
          return {
            style: {
              backgroundColor: s.bg,
              color: s.fg,
              borderColor: s.bd,
              borderRadius: 6,
              padding: "2px 6px",
              fontSize: 12,
            },
          };
        }}
        components={{
          event: ({ event }) => {
            const e = event as CalendarEvent;
            return (
              <div className="truncate">
                <div className="font-medium truncate">{e.title}</div>
                <div className="opacity-90 truncate">
                  {e.client_name ?? ""} {e.assignee_name ? `· ${e.assignee_name}` : ""}
                </div>
              </div>
            );
          },
        }}
      />

      {/* Legend */}
      <div className="mt-3 flex items-center gap-3 flex-wrap text-xs">
        {(["submitted","assigned","in_progress","on_hold","resolved","closed","reopened"] as TicketStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: STATUS_STYLE[s].bg, border: `1px solid ${STATUS_STYLE[s].bd}` }}
            />
            <span className="text-slate-600 capitalize">{s.replace("_", " ")}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
