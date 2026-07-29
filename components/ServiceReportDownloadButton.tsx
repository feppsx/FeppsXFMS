"use client";

import dynamic from "next/dynamic";
import { Download, Loader2 } from "lucide-react";
import { ServiceReportPDF, type ServiceReportPdfInput } from "./ServiceReportPDF";
import type { CompanyBranding } from "@/lib/company-settings-data";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <ButtonShell label="Preparing…" spinning /> }
);

export function ServiceReportDownloadButton({ sr, label = "Download PDF", branding }: { sr: ServiceReportPdfInput; label?: string; branding?: CompanyBranding | null }) {
  return (
    <PDFDownloadLink
      document={<ServiceReportPDF sr={sr} branding={branding} />}
      fileName={`${sr.sr_no}.pdf`}
      className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
    >
      {({ loading }) => (
        <>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? "Rendering…" : label}
        </>
      )}
    </PDFDownloadLink>
  );
}

function ButtonShell({ label, spinning }: { label: string; spinning?: boolean }) {
  return (
    <button disabled className="inline-flex items-center gap-1.5 bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60">
      {spinning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {label}
    </button>
  );
}
