"use client";

// Client wrapper — generates the PayNow QR data URL and hands it to the PDF
// via @react-pdf/renderer's PDFDownloadLink. Renders a Download button.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import QRCode from "qrcode";
import { Download, Loader2 } from "lucide-react";
import type { Invoice, InvoiceItem } from "@/lib/db-types";
import { InvoicePDF } from "./InvoicePDF";

// PDFDownloadLink pulls in @react-pdf/renderer's whole runtime — dynamic import
// keeps it out of the main JS bundle.
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <ButtonShell disabled label="Preparing…" spinning /> }
);

// UEN → simple encoded PayNow string. Real SGQR needs a CRC-16 checksum which
// is overkill for MVP. Any PayNow app can still show "UEN 202212959Z" from this.
const PAYNOW_UEN = "202212959Z";
const QR_TEXT    = `PAYNOW UEN ${PAYNOW_UEN}`;

export function InvoiceDownloadButton({
  invoice, items, technicianSignatureUrl,
  beforePhotos = [], afterPhotos = [],
  className, label = "Download PDF",
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  technicianSignatureUrl?: string | null;
  beforePhotos?: string[];
  afterPhotos?: string[];
  className?: string;
  label?: string;
}) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(QR_TEXT, { margin: 1, width: 220 })
      .then(setQr)
      .catch(() => setQr(""));
  }, []);

  if (qr === null) return <ButtonShell disabled label="Preparing…" spinning />;

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} items={items} qrDataUrl={qr} technicianSignatureUrl={technicianSignatureUrl ?? null} beforePhotos={beforePhotos} afterPhotos={afterPhotos} />}
      fileName={`${invoice.receipt_no}.pdf`}
      className={
        className ??
        "inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium"
      }
    >
      {({ loading }) => (
        <>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {loading ? "Rendering…" : label}
        </>
      )}
    </PDFDownloadLink>
  );
}

function ButtonShell({
  disabled, label, spinning,
}: {
  disabled?: boolean;
  label: string;
  spinning?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className="inline-flex items-center gap-1.5 bg-brand text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
    >
      {spinning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {label}
    </button>
  );
}
