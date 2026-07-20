"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";
import type { Invoice, InvoiceItem } from "@/lib/db-types";
import { CheckCircle2, ArrowRight, Loader2, Eye, Pencil } from "lucide-react";

function money(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Post-save panel for manual invoices. Signs the uploaded photo paths and
 * exposes Download, Preview, and Edit actions.
 */
export function ManualInvoiceConfirmation({
  invoice, items, beforePaths, afterPaths, onEdit,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  beforePaths: string[];
  afterPaths: string[];
  onEdit?: () => void;
}) {
  const [beforeUrls, setBeforeUrls] = useState<string[] | null>(null);
  const [afterUrls, setAfterUrls]   = useState<string[] | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function sign(paths: string[]) {
      const out: string[] = [];
      for (const p of paths) {
        const { data } = await supabase.storage
          .from("ticket-attachments")
          .createSignedUrl(p, 60 * 60);
        if (data?.signedUrl) out.push(data.signedUrl);
      }
      return out;
    }
    sign(beforePaths).then(setBeforeUrls).catch(() => setBeforeUrls([]));
    sign(afterPaths).then(setAfterUrls).catch(() => setAfterUrls([]));
  }, [beforePaths, afterPaths]);

  const ready = beforeUrls !== null && afterUrls !== null;

  if (previewing) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Preview — <span className="font-mono">{invoice.receipt_no}</span>
          </h2>
          <button type="button" onClick={() => setPreviewing(false)} className="text-sm text-brand hover:underline">Close</button>
        </div>

        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-1 text-sm mb-3">
          <div><span className="text-slate-500">Customer:</span> <span className="font-medium">{invoice.customer_name}</span></div>
          {invoice.customer_address && <div><span className="text-slate-500">Address:</span> {invoice.customer_address}</div>}
          {invoice.contact_no && <div><span className="text-slate-500">Contact:</span> {invoice.contact_no}</div>}
          <div><span className="text-slate-500">Date:</span> {invoice.invoice_date}{invoice.time_in && ` · ${invoice.time_in}`}{invoice.time_out && ` → ${invoice.time_out}`}</div>
          <div><span className="text-slate-500">Category:</span> {invoice.category ?? "—"}</div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr><th className="text-left p-2">#</th><th className="text-left p-2">Description</th><th className="text-right p-2">Amount (S$)</th></tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-t border-slate-100">
                  <td className="p-2 text-slate-500">{i + 1}</td>
                  <td className="p-2">{it.description}</td>
                  <td className="p-2 text-right font-mono">{money(Number(it.unit_price))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-right text-sm space-y-0.5 mb-3">
          <div>Subtotal: <span className="font-mono">S$ {money(Number(invoice.subtotal))}</span></div>
          {Number(invoice.discount) > 0 && <div>Discount: <span className="font-mono">-S$ {money(Number(invoice.discount))}</span></div>}
          {Number(invoice.gst_amount) > 0 && <div>GST: <span className="font-mono">S$ {money(Number(invoice.gst_amount))}</span></div>}
          {Number(invoice.deposit_amount) > 0 && <div>Deposit: <span className="font-mono">-S$ {money(Number(invoice.deposit_amount))}</span></div>}
          <div className="text-base font-semibold">Grand Total: <span className="font-mono">S$ {money(Number(invoice.grand_total))}</span></div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
          {ready && (
            <InvoiceDownloadButton
              invoice={invoice}
              items={items}
              beforePhotos={beforeUrls!}
              afterPhotos={afterUrls!}
              label="Download PDF"
            />
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => { setPreviewing(false); onEdit(); }}
              className="inline-flex items-center gap-1.5 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 text-center shadow-card">
      <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">Invoice saved</h1>
      <p className="text-sm text-slate-600 mt-1">
        Receipt <span className="font-mono font-medium">{invoice.receipt_no}</span> —{" "}
        <span className="font-semibold">
          S$ {Number(invoice.grand_total).toLocaleString("en-SG", {
            minimumFractionDigits: 2, maximumFractionDigits: 2,
          })}
        </span>
      </p>

      <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
        {ready ? (
          <InvoiceDownloadButton
            invoice={invoice}
            items={items}
            beforePhotos={beforeUrls!}
            afterPhotos={afterUrls!}
            label="Download PDF"
          />
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-brand text-white rounded-lg px-3 py-2 text-sm font-medium opacity-70">
            <Loader2 className="w-4 h-4 animate-spin" /> Preparing…
          </span>
        )}

        <button
          type="button"
          onClick={() => setPreviewing(true)}
          className="inline-flex items-center gap-1.5 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <Eye className="w-4 h-4" /> Preview
        </button>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        )}

        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 text-sm font-medium"
        >
          Go to invoices <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
