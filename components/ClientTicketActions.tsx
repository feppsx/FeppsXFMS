"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { clientCloseOrReopen } from "@/lib/actions/tickets";
import { CheckCircle2, RotateCcw, Loader2 } from "lucide-react";

/** Shown to the raiser on a resolved ticket. Confirm the fix or reopen it. */
export function ClientTicketActions({ ticketId }: { ticketId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(action: "close" | "reopen") {
    setError(null);
    startTransition(async () => {
      const res = await clientCloseOrReopen(ticketId, action);
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(action === "close" ? "Fix confirmed. Ticket closed." : "Ticket reopened.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-700">
        The technician has marked this ticket <span className="font-medium">Resolved</span>.
        Please confirm the fix or reopen if it&apos;s still an issue.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => act("close")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Confirm fix (close)
        </button>
        <button
          onClick={() => act("reopen")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          <RotateCcw className="w-4 h-4" />
          Not fixed — reopen
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
