import { AppShell } from "@/components/AppShell";
import { requireProfile } from "@/lib/guard";
import { FileText, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GenerateFeaturePage() {
  const profile = await requireProfile(["admin", "technician", "manager"]);
  const isQuotation = "quotations" === "quotations";
  return (
    <AppShell profile={profile}>
      <div className="flex items-center gap-2 mb-2">
        {isQuotation ? <FileText className="w-5 h-5 text-brand" /> : <ClipboardList className="w-5 h-5 text-brand" />}
        <h1 className="text-xl font-semibold">Generate Quotation</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6 max-w-2xl">
        This feature is being built. Full form and PDF export coming in the next update.
      </p>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
        <p className="text-sm text-slate-600">The database schema, RLS policies, and navigation are in place.
        Next release will add the fillable form and PDF export.</p>
      </div>
    </AppShell>
  );
}
