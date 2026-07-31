import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ManagerForm } from "@/components/ManagerForm";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db-types";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditManagerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile(["org_admin"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: manager } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "manager")
    .maybeSingle<Profile>();

  if (!manager) notFound();

  return (
    <AppShell profile={profile}>
      <Link
        href="/admin/managers"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to managers
      </Link>
      <h1 className="text-xl font-semibold mb-4">Edit manager — {manager.full_name}</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <ManagerForm initial={manager} />
      </div>
    </AppShell>
  );
}
