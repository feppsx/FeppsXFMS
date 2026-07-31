import { AppShell } from "@/components/AppShell";
import { CalendarClient } from "@/components/CalendarClient";
import { requireProfile } from "@/lib/guard";
import { getScheduledEvents } from "@/lib/calendar-data";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const profile = await requireProfile(["org_admin"]);
  const events = await getScheduledEvents();

  return (
    <AppShell profile={profile}>
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold">Calendar</h1>
      </div>
      <p className="text-sm text-slate-500 mb-4 max-w-2xl">
        Every ticket with a scheduled visit. Switch between Month, Week, Day and Agenda.
        Click any event to open the ticket.
      </p>
      <CalendarClient events={events} ticketHrefBase="/admin/tickets" />
    </AppShell>
  );
}
