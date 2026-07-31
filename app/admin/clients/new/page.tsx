import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { NewClientForm } from "@/components/NewClientForm";
import { requireProfile } from "@/lib/guard";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  const profile = await requireProfile(["org_admin"]);

  return (
    <AppShell profile={profile}>
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to estates
      </Link>

      <h1 className="text-xl font-semibold mb-4">Add an estate</h1>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <NewClientForm />
      </div>
    </AppShell>
  );
}
