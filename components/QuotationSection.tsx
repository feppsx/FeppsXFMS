"use client";

// Shown on the ticket detail page. Starts as a "Generate Quotation" button;
// expands into the inline QuotationForm; after save, form itself renders the
// download button. Matches InvoiceSection's UX.

import { useState } from "react";
import { QuotationForm, type QuotationPrefill } from "./QuotationForm";
import type { Estate } from "@/lib/db-types";
import { FileText } from "lucide-react";

export function QuotationSection({
  estates,
  prefill,
}: {
  estates: Pick<Estate, "id" | "name" | "location" | "category" | "address" | "contact_phone">[];
  prefill?: QuotationPrefill;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
      >
        <FileText className="w-4 h-4" /> Generate Quotation
      </button>
    );
  }

  return <QuotationForm estates={estates} prefill={prefill} />;
}
