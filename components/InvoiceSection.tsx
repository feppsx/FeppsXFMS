"use client";

// Wrapper shown on the technician detail page: hides the invoice form until
// the tech clicks "Generate Invoice". After save, shows the Download button.

import { useState } from "react";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceDownloadButton } from "./InvoiceDownloadButton";
import type { Invoice, InvoiceItem } from "@/lib/db-types";
import { Receipt } from "lucide-react";

interface Prefill {
  customer_name: string;
  customer_address: string;
  contact_no: string;
  time_in: string;
  time_out: string;
}

export function InvoiceSection({
  ticketId,
  existingInvoice,
  existingItems,
  ticketIsResolved,
  prefill,
}: {
  ticketId: string;
  existingInvoice: Invoice | null;
  existingItems: InvoiceItem[];
  ticketIsResolved: boolean;
  prefill: Prefill;
}) {
  const [showForm, setShowForm] = useState(false);

  if (existingInvoice) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-slate-700">
          Invoice <span className="font-mono font-medium">{existingInvoice.receipt_no}</span> —{" "}
          <span className="font-semibold">
            S$ {existingInvoice.grand_total.toLocaleString("en-SG", {
              minimumFractionDigits: 2, maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <InvoiceDownloadButton invoice={existingInvoice} items={existingItems} />
      </div>
    );
  }

  if (!ticketIsResolved) {
    return (
      <p className="text-xs text-slate-500">
        Mark the ticket <span className="font-medium">Resolved</span> first, then you can generate the invoice.
      </p>
    );
  }

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium"
      >
        <Receipt className="w-4 h-4" />
        Generate invoice
      </button>
    );
  }

  return (
    <InvoiceForm
      ticketId={ticketId}
      prefill={prefill}
      onSaved={() => setShowForm(false)}
    />
  );
}
