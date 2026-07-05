"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { assignTechnician } from "@/lib/actions/tickets";
import { UserCheck, Loader2, Sparkles } from "lucide-react";

export interface TechOption {
  id: string;
  full_name: string;
  trades: string[];   // category names, e.g. ["Electrical", "General"]
}

/**
 * Dropdown + button. When ticketCategoryName is given, technicians whose trades
 * include that category float to the top and get a "recommended" marker.
 */
export function AssignTechnicianForm({
  ticketId,
  technicians,
  currentAssignee,
  ticketCategoryName,
}: {
  ticketId: string;
  technicians: TechOption[];
  currentAssignee: string | null;
  ticketCategoryName?: string | null;
}) {
  const [selected, setSelected] = useState<string>(currentAssignee ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => {
    if (!ticketCategoryName) return technicians;
    return [...technicians].sort((a, b) => {
      const am = a.trades.includes(ticketCategoryName) ? 0 : 1;
      const bm = b.trades.includes(ticketCategoryName) ? 0 : 1;
      if (am !== bm) return am - bm;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [technicians, ticketCategoryName]);

  const selectedTech = technicians.find((t) => t.id === selected);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Pick a technician first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await assignTechnician(ticketId, selected);
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        const tech = technicians.find((t) => t.id === selected);
        toast.success(tech ? `Assigned to ${tech.full_name}` : "Assigned");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-sm"
      >
        <option value="">Select a technician…</option>
        {sorted.map((t) => {
          const match = ticketCategoryName && t.trades.includes(ticketCategoryName);
          const tradesTxt = t.trades.length ? ` (${t.trades.join(", ")})` : "";
          return (
            <option key={t.id} value={t.id}>
              {match ? "★ " : ""}{t.full_name}{tradesTxt}
            </option>
          );
        })}
      </select>

      {selectedTech && ticketCategoryName && selectedTech.trades.includes(ticketCategoryName) && (
        <div className="inline-flex items-center gap-1 text-xs text-emerald-700">
          <Sparkles className="w-3 h-3" />
          Matches this ticket&apos;s category ({ticketCategoryName})
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
        {currentAssignee ? "Reassign" : "Assign"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
