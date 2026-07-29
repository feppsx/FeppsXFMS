import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { MobileHeader } from "@/components/MobileHeader";
import { CompanyBrandingForm } from "@/components/CompanyBrandingForm";
import { requireProfile } from "@/lib/guard";
import { getCompanyBranding } from "@/lib/company-settings-data";
import { ArrowLeft, Palette } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBrandingPage() {
  const profile = await requireProfile(["admin"]);
  const branding = await getCompanyBranding();

  return (
    <>
      <MobileHeader title="Branding" showBack backHref="/admin" />
      <AppShell profile={profile}>
        <div className="hidden md:flex items-center gap-2 mb-2">
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-brand-blue" />
          <h1 className="text-xl font-semibold">Company branding</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6 max-w-2xl">
          These settings appear on the Invoice, Quotation, and Service Report PDFs. Any change takes effect immediately for new downloads.
        </p>
        <CompanyBrandingForm initial={branding} />
      </AppShell>
    </>
  );
}
