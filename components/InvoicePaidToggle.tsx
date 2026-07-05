"use client";

import { useState, useTransition } from "react";
import { toggleInvoicePaid } from "@/lib/actions/invoices";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export function InvoicePaidToggle({
  invoiceId, isPaid,
}: { invoiceId: string; isPaid: boolean }) {
  const [current, setCurrent] = useState(isPaid);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function flip() {
    setError(null);
    const next = !current;
    setCurrent(next);
    startTransition(async () => {
      const res = await toggleInvoicePaid(invoiceId, next);
      if (res.error) {
        setCurrent(!next);
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={flip}
        disabled={isPending}
        className={
          current
            ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium hover:bg-emerald-100 disabled:opacity-60"
            : "inline-flex items-center gap-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-xs font-medium hover:bg-slate-100 disabled:opacity-60"
        }
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : current ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : (
          <Circle className="w-3 h-3" />
        )}
        {current ? "Paid" : "Unpaid"}
      </button>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
