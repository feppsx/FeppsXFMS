import { AppShell } from "@/components/AppShell";
import { TechnicianProfileForm } from "@/components/TechnicianProfileForm";
import { requireProfile } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function TechnicianProfilePage() {
  const profile = await requireProfile(["technician"]);

  return (
    <AppShell profile={profile}>
      <h1 className="text-xl font-semibold mb-4">My profile</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-2xl">
        <TechnicianProfileForm profile={profile} />
      </div>
    </AppShell>
  );
}
