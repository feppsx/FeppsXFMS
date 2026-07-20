import { AppShell } from "@/components/AppShell";
import { TicketRow, type TicketRowData } from "@/components/TicketRow";
import { TicketRealtime } from "@/components/TicketRealtime";
import { TechJobsFilters } from "@/components/TechJobsFilters";
import { MobileHeader } from "@/components/MobileHeader";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

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
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <>
      {/* Mobile red header with greeting + floating search */}
      <MobileHeader
        title=""
        greeting={`${greet()}, ${firstName}`}
        showSearch
        searchPlaceholder="Search jobs…"
      />

      <AppShell profile={profile}>
        <TicketRealtime listMode />
        {/* Desktop-only heading */}
        <h1 className="hidden md:block text-xl font-semibold mb-4">My jobs</h1>

        {/* Filter chips + client-side filtered list */}
        <TechJobsFilters rows={rows} />
      </AppShell>
    </>
  );
}
