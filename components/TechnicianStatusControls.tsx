"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { updateTicketStatus } from "@/lib/actions/tickets";
import type { TicketStatus } from "@/lib/db-types";
import { Play, Pause, CheckCircle2, Loader2 } from "lucide-react";

/** Buttons for a technician to progress a job: Start, Pause, Resume, Resolve. */
export function TechnicianStatusControls({
  ticketId,
  status,
}: {
  ticketId: string;
  status: TicketStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(next: TicketStatus) {
    setError(null);
    startTransition(async () => {
      const res = await updateTicketStatus(ticketId, next);
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        const msg =
          next === "in_progress" ? "Work started" :
          next === "on_hold"     ? "Paused" :
          next === "resolved"    ? "Marked resolved" :
                                    "Status updated";
        toast.success(msg);
      }
    });
  }

  const canStart   = status === "assigned" || status === "on_hold";
  const canPause   = status === "in_progress";
  const canResolve = status === "in_progress" || status === "assigned";

  if (["resolved", "closed", "cancelled"].includes(status)) {
    return <p className="text-sm text-slate-500">No further actions on this job.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canStart && (
          <button
            onClick={() => act("in_progress")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {status === "on_hold" ? "Resume" : "Start work"}
          </button>
        )}
        {canPause && (
          <button
            onClick={() => act("on_hold")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        )}
        {canResolve && (
          <button
            onClick={() => act("resolved")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark resolved
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
