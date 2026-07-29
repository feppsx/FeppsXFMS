"use client";

// Wrapper on the technician (or admin) ticket detail page.
// Life cycle:
//   * If no invoice yet: shows "Generate invoice" button → opens InvoiceForm.
//   * If invoice exists: shows Download + Preview + Edit.
//   * Edit switches into the form pre-loaded, and save updates the same row.

import { useState } from "react";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceDownloadButton } from "./InvoiceDownloadButton";
import type { Invoice, InvoiceItem } from "@/lib/db-types";
import type { CompanyBranding } from "@/lib/company-settings-data";
import { Receipt, Eye, Pencil } from "lucide-react";

interface Prefill {
  customer_name: string;
  customer_address: string;
  contact_no: string;
  time_in: string;
  time_out: string;
}

function money(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoiceSection({
  ticketId,
  existingInvoice,
  existingItems,
  ticketIsResolved,
  prefill,
  technicianSignatureUrl,
  beforePhotos = [],
  afterPhotos = [],
  branding,
}: {
  ticketId: string;
  existingInvoice: Invoice | null;
  existingItems: InvoiceItem[];
  ticketIsResolved: boolean;
  prefill: Prefill;
  technicianSignatureUrl?: string | null;
  beforePhotos?: string[];
  afterPhotos?: string[];
  branding?: CompanyBranding | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Existing invoice — the meat of the new UI (Download / Preview / Edit)
  if (existingInvoice && !editing) {
    if (previewing) {
      return (
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Preview — <span className="font-mono">{existingInvoice.receipt_no}</span></h3>
            <button type="button" onClick={() => setPreviewing(false)} className="text-brand hover:underline">Close</button>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-1">
            <div><span className="text-slate-500">Customer:</span> <span className="font-medium">{existingInvoice.customer_name}</span></div>
            {existingInvoice.customer_address && <div><span className="text-slate-500">Address:</span> {existingInvoice.customer_address}</div>}
            {existingInvoice.contact_no && <div><span className="text-slate-500">Contact:</span> {existingInvoice.contact_no}</div>}
            <div><span className="text-slate-500">Date:</span> {existingInvoice.invoice_date}{existingInvoice.time_in && ` · ${existingInvoice.time_in}`}{existingInvoice.time_out && ` → ${existingInvoice.time_out}`}</div>
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr><th className="text-left p-2">#</th><th className="text-left p-2">Description</th><th className="text-right p-2">Amount (S$)</th></tr>
              </thead>
              <tbody>
                {existingItems.map((it, i) => (
                  <tr key={it.id} className="border-t border-slate-100">
                    <td className="p-2 text-slate-500">{i + 1}</td>
                    <td className="p-2">{it.description}</td>
                    <td className="p-2 text-right font-mono">{money(Number(it.unit_price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-right space-y-0.5">
            <div>Subtotal: <span className="font-mono">S$ {money(Number(existingInvoice.subtotal))}</span></div>
            {Number(existingInvoice.discount) > 0 && <div>Discount: <span className="font-mono">-S$ {money(Number(existingInvoice.discount))}</span></div>}
            {Number(existingInvoice.gst_amount) > 0 && <div>GST: <span className="font-mono">S$ {money(Number(existingInvoice.gst_amount))}</span></div>}
            {Number(existingInvoice.deposit_amount) > 0 && <div>Deposit: <span className="font-mono">-S$ {money(Number(existingInvoice.deposit_amount))}</span></div>}
            <div className="text-base font-semibold">Grand Total: <span className="font-mono">S$ {money(Number(existingInvoice.grand_total))}</span></div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            <InvoiceDownloadButton branding={branding} invoice={existingInvoice} items={existingItems} technicianSignatureUrl={technicianSignatureUrl} beforePhotos={beforePhotos} afterPhotos={afterPhotos} />
            <button type="button" onClick={() => { setPreviewing(false); setEditing(true); }} className="inline-flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-sm text-slate-700">
          Invoice <span className="font-mono font-medium">{existingInvoice.receipt_no}</span> —{" "}
          <span className="font-semibold">
            S$ {Number(existingInvoice.grand_total).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <InvoiceDownloadButton branding={branding} invoice={existingInvoice} items={existingItems} technicianSignatureUrl={technicianSignatureUrl} beforePhotos={beforePhotos} afterPhotos={afterPhotos} />
          <button type="button" onClick={() => setPreviewing(true)} className="inline-flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>
    );
  }

  // Edit mode — form loaded with existing invoice + items
  if (existingInvoice && editing) {
    return (
      <InvoiceForm
        ticketId={ticketId}
        prefill={prefill}
        editing={{ invoice: existingInvoice, items: existingItems }}
        onSaved={() => setEditing(false)}
      />
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
