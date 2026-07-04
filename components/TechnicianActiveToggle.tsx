"use client";

import { useTransition, useState } from "react";
import { setTechnicianActive } from "@/lib/actions/technicians";
import { Power, Loader2 } from "lucide-react";

export function TechnicianActiveToggle({
  technicianId,
  isActive,
}: {
  technicianId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle() {
    if (!confirm(
      isActive
        ? "Deactivate this technician? They won't be assignable to new tickets. Existing assignments stay."
        : "Reactivate this technician?"
    )) return;
    setError(null);
    startTransition(async () => {
      const res = await setTechnicianActive(technicianId, !isActive);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handle}
        disabled={isPending}
        className={
          isActive
            ? "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-2.5 py-1 text-xs font-medium disabled:opacity-60"
            : "inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-medium disabled:opacity-60"
        }
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
        {isActive ? "Deactivate" : "Reactivate"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
