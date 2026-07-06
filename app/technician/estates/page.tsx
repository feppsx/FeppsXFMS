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
  // Show ALL active estates to both technicians and managers — the ticket
  // counts on each card reflect what they can see (RLS still hides tickets
  // that aren't assigned to a technician).
  const estates = await getEstateCards();

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
          title="No active estates yet."
          message="Ask the admin to add an estate to get started."
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
