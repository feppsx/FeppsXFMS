import { AppShell } from "@/components/AppShell";
import { EstatesLive } from "@/components/EstatesLive";
import { requireProfile } from "@/lib/guard";
import { getEstateCards } from "@/lib/estate-data";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TechEstatesPage() {
  const profile = await requireProfile(["technician", "manager"]);
  const estates = await getEstateCards();

  return (
    <AppShell profile={profile}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold">
          {profile.role === "manager" ? "Estates" : "My estates"}
        </h1>
        <span className="text-xs font-normal text-slate-500 ml-2">
          (newest ticket floats to the top)
        </span>
      </div>

      <EstatesLive initial={estates} hrefBase="/technician/estates" />
    </AppShell>
  );
}
