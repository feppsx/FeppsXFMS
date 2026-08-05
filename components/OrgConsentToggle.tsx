"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setOrgConsentRequired } from "@/lib/actions/platform-admin";
import { ShieldCheck, ShieldOff } from "lucide-react";

export function OrgConsentToggle({
  orgId,
  required,
}: {
  orgId: string;
  required: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    const res = await setOrgConsentRequired(orgId, !required);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {required ? (
          <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        ) : (
          <ShieldOff className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
        )}
        <div>
          <div className="text-sm font-medium text-slate-900">Require user approval for support impersonation</div>
          <div className="text-xs text-slate-500 mt-0.5">
            When on, any platform admin trying to impersonate a user in this org must wait for that user to
            approve the request in-app. When off, impersonation is one-click (still audited).
          </div>
          {error && <div className="text-xs text-red-700 mt-2">{error}</div>}
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={
          "shrink-0 inline-flex items-center h-6 w-11 rounded-full transition " +
          (required ? "bg-emerald-500" : "bg-slate-300") +
          " disabled:opacity-50"
        }
      >
        <span
          className={
            "inline-block h-5 w-5 bg-white rounded-full shadow transform transition " +
            (required ? "translate-x-5" : "translate-x-0.5")
          }
        />
      </button>
    </div>
  );
}
