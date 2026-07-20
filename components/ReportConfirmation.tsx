"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Bell, Download, CheckCircle2 } from "lucide-react";

export function ReportConfirmation({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }

  const today = new Date().toLocaleDateString("en-SG", {
    day: "numeric", month: "numeric", year: "numeric",
  });

  return (
    <div className="max-w-md mx-auto text-center">
      {/* Big red check badge */}
      <div className="mt-6 mb-4 flex justify-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-[30%] bg-brand-red rotate-[15deg]" />
          <div className="absolute inset-0 rounded-[30%] bg-brand-red -rotate-[15deg]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>

      <p className="text-slate-800 text-lg leading-snug px-4">
        Your request has been received.<br />
        Our team will get back to you shortly.
      </p>

      {/* Ticket ID */}
      <div className="mt-6">
        <div className="inline-flex items-center gap-2 text-3xl font-bold">
          <span className="text-brand-blue">TICKET ID :</span>
          <span className="text-slate-900 font-mono">{token}</span>
          <button type="button" onClick={copy} aria-label="Copy" className="text-slate-500 hover:text-brand-blue">
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="mt-6 bg-info-blue rounded-3xl p-5 text-left">
        <dl className="grid grid-cols-2 gap-y-3 text-slate-800">
          <dt className="font-medium">Name</dt>
          <dd className="text-slate-600">—</dd>
          <dt className="font-medium">Date</dt>
          <dd className="text-slate-600">{today}</dd>
          <dt className="font-medium">Ticket ID</dt>
          <dd className="text-slate-600 font-mono">{token}</dd>
        </dl>
      </div>

      {/* Download hint */}
      <div className="mt-4 text-slate-600 inline-flex items-center gap-2">
        <Download className="w-4 h-4" />
        <button type="button" onClick={() => window.print()} className="text-slate-700 hover:text-brand-blue">
          Download Ticket Details
        </button>
      </div>

      {/* Save reminder */}
      <div className="mt-4 flex items-start gap-2 text-slate-700 text-left px-4">
        <Bell className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
        <p className="text-sm">Save this Ticket ID to check status or leave feedback later.</p>
      </div>

      {/* CTA */}
      <div className="mt-8 flex justify-center">
        <Link
          href={`/track/${token}`}
          className="inline-flex items-center justify-center bg-brand-blue hover:bg-brand-blue/90 text-white text-base font-semibold rounded-full px-10 py-3 shadow-float"
        >
          CHECK STATUS
        </Link>
      </div>
    </div>
  );
}
