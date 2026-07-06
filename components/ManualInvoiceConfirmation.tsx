"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";
import type { Invoice, InvoiceItem } from "@/lib/db-types";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

/**
 * Shown right after a successful manual-invoice save. Turns the storage paths
 * that were uploaded during the form into signed URLs, then hands everything
 * to InvoiceDownloadButton so the admin can grab the PDF immediately.
 */
export function ManualInvoiceConfirmation({
  invoice, items, beforePaths, afterPaths,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  beforePaths: string[];
  afterPaths: string[];
}) {
  const [beforeUrls, setBeforeUrls] = useState<string[] | null>(null);
  const [afterUrls, setAfterUrls]   = useState<string[] | null>(null);

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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 text-center shadow-card">
      <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">Invoice created</h1>
      <p className="text-sm text-slate-600 mt-1">
        Receipt <span className="font-mono font-medium">{invoice.receipt_no}</span> —{" "}
        <span className="font-semibold">
          S$ {Number(invoice.grand_total).toLocaleString("en-SG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </p>

      <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
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
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing…
          </span>
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
