"use client";

// Rendered inside AppShell for every signed-in tenant page.
// Polls once on mount + subscribes to realtime, so a pending impersonation
// request pops up whether the user was already on a page or not.
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { respondToImpersonation } from "@/lib/actions/impersonation-consent";
import { ShieldAlert, Check, X } from "lucide-react";

interface PendingRequest {
  id: string;
  reason: string;
  created_at: string;
  expires_at: string;
}

export function ImpersonationConsent({ userId }: { userId: string }) {
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadPending() {
      const { data } = await supabase
        .from("impersonation_requests")
        .select("id, reason, created_at, expires_at")
        .eq("target_user_id", userId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      const row = (data?.[0] ?? null) as PendingRequest | null;
      setPending(row);
    }

    loadPending();

    const channel = supabase
      .channel(`impersonation:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "impersonation_requests", filter: `target_user_id=eq.${userId}` },
        () => loadPending()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "impersonation_requests", filter: `target_user_id=eq.${userId}` },
        () => loadPending()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!pending) return null;

  async function decide(approve: boolean) {
    if (!pending) return;
    setBusy(true);
    await respondToImpersonation(pending.id, approve);
    setBusy(false);
    setPending(null);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">FeppsXFMS support wants to access your workspace</h2>
            <p className="text-sm text-slate-600 mt-1">
              They'll be able to see everything you can see, for as long as they stay signed in as you.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Reason</div>
          <div className="text-sm text-slate-900 whitespace-pre-wrap">{pending.reason}</div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => decide(false)}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <X className="w-4 h-4" /> Deny
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 text-white py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}
