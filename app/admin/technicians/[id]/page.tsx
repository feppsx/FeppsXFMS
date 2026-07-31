import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TechnicianForm } from "@/components/TechnicianForm";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db-types";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditTechnicianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile(["org_admin"]);
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tech }, { data: tradeRows }, { data: categories }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).eq("role", "technician").maybeSingle<Profile>(),
    supabase.from("technician_trades").select("category_id").eq("technician_id", id),
    supabase.from("ticket_categories").select("id, name").eq("is_active", true).order("name"),
  ]);

  if (!tech) notFound();

  const trades = (tradeRows ?? []).map((r) => r.category_id as string);

  return (
    <AppShell profile={profile}>
      <Link
        href="/admin/technicians"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to technicians
      </Link>
      <h1 className="text-xl font-semibold mb-4">Edit technician — {tech.full_name}</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <TechnicianForm categories={categories ?? []} initial={{ ...tech, trades }} />
      </div>
    </AppShell>
  );
}
