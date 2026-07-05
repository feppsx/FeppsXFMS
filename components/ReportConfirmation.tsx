"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Printer, CheckCircle2 } from "lucide-react";

export function ReportConfirmation({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 text-center shadow-card">
      <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-semibold text-slate-900">Ticket submitted</h1>
      <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
        Thanks — someone from 360 Integrated will look at your request shortly.
        <br />
        Note down this tracking code to check the status later:
      </p>

      <div className="mt-6 inline-flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-2xl px-6 py-4">
        <span className="font-mono text-2xl md:text-3xl font-bold text-brand tracking-wider">
          {token}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-lg border border-brand text-brand hover:bg-brand hover:text-white px-3 py-1.5 text-sm font-medium transition"
          title="Copy"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
        <Link
          href={`/track/${token}`}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium shadow-card"
        >
          Check status now
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 text-sm font-medium"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-6 max-w-md mx-auto">
        You can also visit <span className="font-medium">/track</span> any time and
        enter this code to see updates.
      </p>
    </div>
  );
}
