"use client";

import { useState, useRef } from "react";
import { LogIn, KeyRound, Copy, Check, X, Loader2 } from "lucide-react";
import {
  startImpersonation,
  pollImpersonation,
  cancelImpersonation,
  resetUserPassword,
} from "@/lib/actions/platform-admin";
import { createClient } from "@/lib/supabase/client";

export function PlatformTeamActions({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [phase, setPhase] = useState<"idle" | "reason" | "waiting" | "done">("idle");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reset, setReset] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingReq = useRef<string | null>(null);

  // ---------- Impersonate: reason -> maybe wait -> verifyOtp -------------
  async function submitReason() {
    setError(null);
    const res = await startImpersonation(userId, reason);
    if (res.error) { setError(res.error); return; }

    if (res.status === "ready" && res.tokenHash) {
      // Consent not required — proceed straight to verifyOtp.
      await finishWithToken(res.tokenHash);
      return;
    }

    if (res.status === "pending" && res.requestId) {
      pollingReq.current = res.requestId;
      setPhase("waiting");
      pollLoop(res.requestId);
      return;
    }

    setError("Unexpected response from server.");
  }

  async function pollLoop(requestId: string) {
    // Poll every 3s until approved/denied/expired.
    const started = Date.now();
    while (pollingReq.current === requestId && Date.now() - started < 20 * 60 * 1000) {
      await new Promise((r) => setTimeout(r, 3000));
      if (pollingReq.current !== requestId) return; // cancelled
      const st = await pollImpersonation(requestId);
      if (st.error) { setError(st.error); setPhase("idle"); return; }
      if (st.status === "approved" && st.tokenHash) {
        await finishWithToken(st.tokenHash);
        return;
      }
      if (st.status === "denied")  { setError("The user denied the request."); setPhase("idle"); return; }
      if (st.status === "expired") { setError("Request expired."); setPhase("idle"); return; }
      // else pending: keep polling
    }
  }

  async function finishWithToken(tokenHash: string) {
    const supabase = createClient();
    const { error: otpErr } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (otpErr) { setError(`Impersonation failed: ${otpErr.message}`); setPhase("idle"); return; }
    window.location.href = "/";
  }

  async function cancelWaiting() {
    if (pollingReq.current) {
      await cancelImpersonation(pollingReq.current);
      pollingReq.current = null;
    }
    setPhase("idle");
    setReason("");
  }

  // ---------- Reset password ---------------------------------------------
  async function doReset() {
    if (!confirm(`Generate a new password for ${userName}? Their current password will stop working immediately.`)) return;
    setError(null);
    const res = await resetUserPassword(userId);
    if (res.error) { setError(res.error); return; }
    if (res.email && res.tempPassword) setReset({ email: res.email, tempPassword: res.tempPassword });
  }

  return (
    <>
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={() => { setError(null); setPhase("reason"); }}
          disabled={phase !== "idle"}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-red-700 disabled:opacity-40"
          title="Sign in as this user for support"
        >
          <LogIn className="w-3.5 h-3.5" /> Impersonate
        </button>
        <button
          type="button"
          onClick={doReset}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-red-700"
          title="Generate a new password"
        >
          <KeyRound className="w-3.5 h-3.5" /> Reset password
        </button>
      </div>
      {error && <div className="text-xs text-red-700 mt-1 text-right">{error}</div>}

      {/* Reason prompt */}
      {phase === "reason" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 relative">
            <button type="button" onClick={() => setPhase("idle")} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Impersonate {userName}</h2>
            <p className="text-sm text-slate-600 mb-4">
              Enter a short reason. This goes into the audit log, and (if the org requires consent) is shown to the user.
            </p>
            {error && <div className="text-sm text-red-700 mb-3">{error}</div>}
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Debugging ticket #4592 – customer can't see new invoices"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setPhase("idle")} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={submitReason} className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for consent */}
      {phase === "waiting" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-red-600 animate-spin mb-3" />
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Waiting for {userName}</h2>
            <p className="text-sm text-slate-600 mb-4">
              A consent prompt has been sent. This will auto-proceed as soon as they approve, or cancel below.
            </p>
            <button type="button" onClick={cancelWaiting} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reset password result */}
      {reset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 relative">
            <button type="button" onClick={() => setReset(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Password reset</h2>
            <p className="text-sm text-slate-600 mb-4">Share these credentials with the user. Password is shown once.</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm font-mono">
              <div className="text-emerald-700 text-xs uppercase">Email</div>
              <div className="mb-2 text-slate-900">{reset.email}</div>
              <div className="text-emerald-700 text-xs uppercase">New password</div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900">{reset.tempPassword}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(reset.tempPassword);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white border border-emerald-300 hover:bg-emerald-50"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReset(null)}
              className="mt-4 w-full rounded-full bg-red-600 text-white py-2 text-sm font-medium hover:bg-red-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
