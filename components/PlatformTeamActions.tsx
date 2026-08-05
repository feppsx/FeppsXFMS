"use client";

import { useState } from "react";
import { LogIn, KeyRound, Copy, Check, X } from "lucide-react";
import { impersonateUser, resetUserPassword } from "@/lib/actions/platform-admin";
import { createClient } from "@/lib/supabase/client";

export function PlatformTeamActions({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [busy, setBusy] = useState<null | "impersonate" | "reset">(null);
  const [reset, setReset] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doImpersonate() {
    if (!confirm(`Sign out and log in as ${userName}? You'll need to sign back in as yourself when done.`)) return;
    setBusy("impersonate");
    setError(null);

    // Server generates a magic-link token for the target user.
    const res = await impersonateUser(userId);
    if (res?.error) { setError(res.error); setBusy(null); return; }
    if (!res?.tokenHash) { setError("No token returned."); setBusy(null); return; }

    // Verify the token client-side. This overwrites the platform admin's
    // session cookie with the impersonated user's session in one call, on
    // our own domain — no external redirect, no PKCE mismatch.
    const supabase = createClient();
    const { error: otpErr } = await supabase.auth.verifyOtp({
      token_hash: res.tokenHash,
      type: "magiclink",
    });
    if (otpErr) { setError(`Impersonation failed: ${otpErr.message}`); setBusy(null); return; }

    // Hard reload to `/` so the server components re-render with the new
    // session cookie. Root page routes us to the target user's home.
    window.location.href = "/";
  }

  async function doReset() {
    if (!confirm(`Generate a new password for ${userName}? Their current password will stop working immediately.`)) return;
    setBusy("reset");
    setError(null);
    const res = await resetUserPassword(userId);
    setBusy(null);
    if (res.error) { setError(res.error); return; }
    if (res.email && res.tempPassword) setReset({ email: res.email, tempPassword: res.tempPassword });
  }

  return (
    <>
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={doImpersonate}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-red-700 disabled:opacity-40"
          title="Sign in as this user for support"
        >
          <LogIn className="w-3.5 h-3.5" /> Impersonate
        </button>
        <button
          type="button"
          onClick={doReset}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-red-700 disabled:opacity-40"
          title="Generate a new password"
        >
          <KeyRound className="w-3.5 h-3.5" /> Reset password
        </button>
      </div>
      {error && <div className="text-xs text-red-700 mt-1 text-right">{error}</div>}

      {reset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 relative">
            <button
              type="button"
              onClick={() => setReset(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
            >
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
