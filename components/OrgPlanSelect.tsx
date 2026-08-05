"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeOrgPlan } from "@/lib/actions/platform-admin";

const OPTIONS = ["free", "pro", "business", "enterprise"] as const;

export function OrgPlanSelect({ orgId, currentPlan }: { orgId: string; currentPlan: string }) {
  const router = useRouter();
  const [value, setValue] = useState(currentPlan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: string) {
    setValue(next);
    setBusy(true);
    setError(null);
    const res = await changeOrgPlan(orgId, next);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Plan</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={busy}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        {OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {error && <div className="text-xs text-red-700 mt-2">{error}</div>}
      <div className="text-xs text-slate-500 mt-2">
        Manual change; audit-logged. Stripe self-serve billing comes later.
      </div>
    </div>
  );
}
