import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TicketRow, type TicketRowData } from "@/components/TicketRow";
import { TicketRealtime } from "@/components/TicketRealtime";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyTicketsPage() {
  const profile = await requireProfile(["requester"]);
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select(`
      *,
      category:ticket_categories(name),
      client:clients(name, location),
      tenant:client_tenants(name)
    `)
    .order("created_at", { ascending: false })
    .returns<TicketRowData[]>();

  const rows = tickets ?? [];

  return (
    <AppShell profile={profile}>
      <TicketRealtime listMode />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My tickets</h1>
        <Link
          href="/client/tickets/new"
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          Raise ticket
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          No tickets yet. Click <span className="font-medium">Raise ticket</span> to report an issue.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((t) => (
            <TicketRow key={t.id} ticket={t} hrefBase="/client/tickets" />
          ))}
        </div>
      )}
    </AppShell>
  );
}
