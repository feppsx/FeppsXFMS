"use client";

import { useState } from "react";
import { ServiceReportForm, type ServiceReportPrefill } from "./ServiceReportForm";
import type { Estate } from "@/lib/db-types";
import type { CompanyBranding } from "@/lib/company-settings-data";
import { ClipboardList } from "lucide-react";

export function ServiceReportSection({
  estates,
  prefill,
  branding,
}: {
  estates: Pick<Estate, "id" | "name" | "location" | "address" | "contact_phone">[];
  prefill?: ServiceReportPrefill;
  branding?: CompanyBranding | null;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
      >
        <ClipboardList className="w-4 h-4" /> Generate Service Report
      </button>
    );
  }

  return <ServiceReportForm estates={estates} prefill={prefill} branding={branding} />;
}
