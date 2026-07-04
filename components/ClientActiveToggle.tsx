"use client";

import { useTransition, useState } from "react";
import { toggleClientActive } from "@/lib/actions/clients";
import { Power, Loader2 } from "lucide-react";

/** Deactivate / Reactivate a client. Inactive clients don't show up in the ticket form dropdown. */
export function ClientActiveToggle({
  clientId,
  isActive,
}: {
  clientId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle() {
    if (!confirm(
      isActive
        ? "Deactivate this client? Requesters won't be able to raise new tickets against it. Existing tickets stay untouched."
        : "Reactivate this client?"
    )) return;
    setError(null);
    startTransition(async () => {
      const res = await toggleClientActive(clientId, !isActive);
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
