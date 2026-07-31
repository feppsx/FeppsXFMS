import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ManagerForm } from "@/components/ManagerForm";
import { requireProfile } from "@/lib/guard";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewManagerPage() {
  const profile = await requireProfile(["org_admin"]);

  return (
    <AppShell profile={profile}>
      <Link
        href="/admin/managers"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <h1 className="text-xl font-semibold mb-4">Add a manager</h1>
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <ManagerForm />
      </div>
    </AppShell>
  );
}
