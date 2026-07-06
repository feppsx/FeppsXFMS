import { AppShell } from "@/components/AppShell";
import { EstateCard } from "@/components/EstateCard";
import { TicketRealtime } from "@/components/TicketRealtime";
import { EmptyState } from "@/components/EmptyState";
import { requireProfile } from "@/lib/guard";
import { getEstateCards } from "@/lib/estate-data";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TechEstatesPage() {
  const profile = await requireProfile(["technician", "manager"]);
  const estatesAll = await getEstateCards();

  // Technicians only see estates where they have at least one visible ticket
  // (RLS restricts their ticket reads to assigned tickets). Managers see
  // everything because their read policy covers all tickets.
  const estates =
    profile.role === "manager"
      ? estatesAll
      : estatesAll.filter((e) => e.newest_ticket_at !== null);

  return (
    <AppShell profile={profile}>
      <TicketRealtime listMode />
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold">
          {profile.role === "manager" ? "Estates" : "My estates"}
        </h1>
        <span className="text-xs font-normal text-slate-500 ml-2">
          (newest ticket floats to the top)
        </span>
      </div>

      {estates.length === 0 ? (
        <EmptyState
          variant="clients"
          title={
            profile.role === "manager"
              ? "No active estates yet."
              : "No estates have work assigned to you."
          }
          message={
            profile.role === "manager"
              ? "Ask the admin to add an estate to get started."
              : "You'll see an estate here as soon as a ticket is assigned to you."
          }
        />
      ) : (
        <div className="space-y-2">
          {estates.map((e) => (
            <EstateCard key={e.id} data={e} hrefBase="/technician/estates" />
          ))}
        </div>
      )}
    </AppShell>
  );
}
