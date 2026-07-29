import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { QuotationForm } from "@/components/QuotationForm";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { Estate } from "@/lib/db-types";
import { getCompanyBranding } from "@/lib/company-settings-data";
import { ArrowLeft, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminGenerateQuotationPage() {
  const profile = await requireProfile(["admin"]);
  const supabase = await createClient();
  const { data: estates } = await supabase
    .from("clients")
    .select("id, name, location, category, address, contact_phone")
    .eq("is_active", true)
    .order("name")
    .returns<Pick<Estate, "id" | "name" | "location" | "category" | "address" | "contact_phone">[]>();
  const branding = await getCompanyBranding();

  return (
    <AppShell profile={profile}>
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold">Generate Quotation</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6 max-w-2xl">
        Build a quotation from scratch — no ticket required. Pick an estate to auto-fill customer details.
      </p>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 shadow-card">
        <QuotationForm estates={estates ?? []} branding={branding} />
      </div>
    </AppShell>
  );
}
