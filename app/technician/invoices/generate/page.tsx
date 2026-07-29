import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ManualInvoiceForm } from "@/components/ManualInvoiceForm";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { Estate } from "@/lib/db-types";
import { getCompanyBranding } from "@/lib/company-settings-data";
import { ArrowLeft, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TechGenerateInvoicePage() {
  const profile = await requireProfile(["technician", "manager"]);
  const supabase = await createClient();

  const { data: estates } = await supabase
    .from("clients")
    .select("id, name, location, category, address, contact_phone")
    .eq("is_active", true)
    .order("name")
    .order("location")
    .returns<Pick<Estate, "id" | "name" | "location" | "category" | "address" | "contact_phone">[]>();
  const branding = await getCompanyBranding();

  return (
    <AppShell profile={profile}>
      <Link
        href="/technician/invoices"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to invoices
      </Link>

      <div className="flex items-center gap-2 mb-2">
        <PlusCircle className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold">Generate Invoice</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6 max-w-2xl">
        Build an invoice on the fly — no ticket required. Pick an estate to auto-fill customer
        details, or bill directly to any name.
      </p>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 shadow-card">
        <ManualInvoiceForm estates={estates ?? []} branding={branding} />
      </div>
    </AppShell>
  );
}
