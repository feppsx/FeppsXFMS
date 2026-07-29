"use client";

// Client wrapper — generates the PayNow QR data URL, exposes an "Include photo
// evidence" checkbox when before/after photos exist, and hands everything to
// @react-pdf/renderer's PDFDownloadLink.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import QRCode from "qrcode";
import { Download, Loader2, Camera } from "lucide-react";
import type { Invoice, InvoiceItem } from "@/lib/db-types";
import { InvoicePDF } from "./InvoicePDF";
import type { CompanyBranding } from "@/lib/company-settings-data";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <ButtonShell disabled label="Preparing…" spinning /> }
);

const PAYNOW_UEN = "202212959Z";
const QR_TEXT    = `PAYNOW UEN ${PAYNOW_UEN}`;

export function InvoiceDownloadButton({
  invoice, items, technicianSignatureUrl,
  beforePhotos = [], afterPhotos = [],
  className, label = "Download PDF", branding,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
  technicianSignatureUrl?: string | null;
  beforePhotos?: string[];
  afterPhotos?: string[];
  className?: string;
  label?: string;
  branding?: CompanyBranding | null;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [includePhotos, setIncludePhotos] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(QR_TEXT, { margin: 1, width: 220 })
      .then(setQr)
      .catch(() => setQr(""));
  }, []);

  if (qr === null) return <ButtonShell disabled label="Preparing…" spinning />;

  const hasPhotos = beforePhotos.length > 0 || afterPhotos.length > 0;

  // Only include photos in the PDF when the user opted in AND photos exist.
  const before = includePhotos ? beforePhotos : [];
  const after  = includePhotos ? afterPhotos  : [];

  // Filename hint so users can tell the two variants apart on disk.
  const fileName = includePhotos && hasPhotos
    ? `${invoice.receipt_no}-with-photos.pdf`
    : `${invoice.receipt_no}.pdf`;

  return (
    <div className="space-y-2">
      {hasPhotos && (
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includePhotos}
            onChange={(e) => setIncludePhotos(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
          />
          <Camera className="w-4 h-4 text-slate-500" />
          <span>
            Add photo evidence{" "}
            <span className="text-slate-500">
              ({beforePhotos.length} before · {afterPhotos.length} after)
            </span>
          </span>
        </label>
      )}

      <PDFDownloadLink
        key={includePhotos ? "with-photos" : "no-photos"}
        document={
          <InvoicePDF
            invoice={invoice}
            items={items}
            branding={branding}
            qrDataUrl={qr}
            technicianSignatureUrl={technicianSignatureUrl ?? null}
            beforePhotos={before}
            afterPhotos={after}
          />
        }
        fileName={fileName}
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
    </div>
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
