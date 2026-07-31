"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setOrgSuspended, deleteOrganization } from "@/lib/actions/organizations";
import { PauseCircle, PlayCircle, Trash2 } from "lucide-react";

export function OrgDetailActions({
  orgId,
  isSuspended,
  canDelete,
}: {
  orgId: string;
  isSuspended: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleSuspend() {
    setBusy(true);
    setError(null);
    const res = await setOrgSuspended(orgId, !isSuspended);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    router.refresh();
  }

  async function doDelete() {
    if (!confirm("Permanently delete this organization and all its data? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    const res = await deleteOrganization(orgId);
    setBusy(false);
    if (res?.error) setError(res.error);
    // deleteOrganization redirects on success
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isSuspended ? (
        <button
          type="button"
          onClick={toggleSuspend}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-3.5 py-1.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4" /> Reactivate
        </button>
      ) : (
        <button
          type="button"
          onClick={toggleSuspend}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 text-white px-3.5 py-1.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          <PauseCircle className="w-4 h-4" /> Suspend
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={doDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-300 text-red-700 px-3.5 py-1.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      )}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
