"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, Printer } from "lucide-react";

export function QrDisplay({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, {
      margin: 2, width: 512, errorCorrectionLevel: "M",
      color: { dark: "#0f4c81", light: "#ffffff" },
    }).then(setDataUrl).catch(() => setDataUrl(""));
  }, [url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "report-qr.png";
    a.click();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* QR itself */}
        <div className="w-64 h-64 bg-white border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="QR code" className="w-full h-full object-contain" />
          ) : (
            <div className="text-slate-400 text-sm">Generating…</div>
          )}
        </div>

        {/* Details + actions */}
        <div className="flex-1 min-w-0 space-y-3 text-center md:text-left">
          <div>
            <div className="text-xs text-slate-500 mb-1">Link</div>
            <div className="font-mono text-sm text-slate-800 break-all">{url}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 text-sm font-medium"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={download}
              disabled={!dataUrl}
              className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60 shadow-card"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Anyone who scans this QR (or opens the link) lands on the report form.
            No login needed — they fill their details, describe the issue, and submit.
          </p>
        </div>
      </div>
    </div>
  );
}
