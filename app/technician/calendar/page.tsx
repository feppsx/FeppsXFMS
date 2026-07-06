import { AppShell } from "@/components/AppShell";
import { CalendarClient } from "@/components/CalendarClient";
import { requireProfile } from "@/lib/guard";
import { getScheduledEvents } from "@/lib/calendar-data";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TechCalendarPage() {
  const profile = await requireProfile(["technician", "manager"]);
  // RLS narrows to their own tickets for technicians; managers see all.
  const events = await getScheduledEvents();

  return (
    <AppShell profile={profile}>
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold">
          {profile.role === "manager" ? "Team calendar" : "My calendar"}
        </h1>
      </div>
      <p className="text-sm text-slate-500 mb-4 max-w-2xl">
        {profile.role === "manager"
          ? "Every scheduled visit across the team. Click an event to open the ticket."
          : "Your upcoming scheduled visits. Click an event to open the job."}
      </p>
      <CalendarClient events={events} ticketHrefBase="/technician/jobs" />
    </AppShell>
  );
}
