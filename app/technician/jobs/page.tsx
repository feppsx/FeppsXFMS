import { AppShell } from "@/components/AppShell";
import { TicketRow, type TicketRowData } from "@/components/TicketRow";
import { TicketRealtime } from "@/components/TicketRealtime";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TechnicianJobsPage() {
  const profile = await requireProfile(["technician", "manager"]);
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select(`
      *,
      category:ticket_categories(name, color),
      client:clients(name, location),
      tenant:client_tenants(name)
    `)
    .order("created_at", { ascending: false })
    .returns<TicketRowData[]>();

  const rows = tickets ?? [];

  return (
    <AppShell profile={profile}>
      <TicketRealtime listMode />
      <h1 className="text-xl font-semibold mb-4">My jobs</h1>
      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          Nothing assigned to you right now.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((t) => (
            <TicketRow key={t.id} ticket={t} hrefBase="/technician/jobs" />
          ))}
        </div>
      )}
    </AppShell>
  );
}
