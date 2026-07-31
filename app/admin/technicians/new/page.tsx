import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TechnicianForm } from "@/components/TechnicianForm";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewTechnicianPage() {
  const profile = await requireProfile(["org_admin"]);
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("ticket_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <AppShell profile={profile}>
      <Link
        href="/admin/technicians"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <h1 className="text-xl font-semibold mb-4">Add a technician</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <TechnicianForm categories={categories ?? []} />
      </div>
    </AppShell>
  );
}
