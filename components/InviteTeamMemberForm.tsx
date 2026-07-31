"use client";

// Modal-ish inline form to invite a team member. Shows the generated temp
// password once for the admin to share with the invitee.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteTeamMember } from "@/lib/actions/invitations";
import { Copy, Check, X } from "lucide-react";

export function InviteTeamMemberForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await inviteTeamMember(fd);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    if (res.email && res.tempPassword) setResult({ email: res.email, tempPassword: res.tempPassword });
  }

  function done() {
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {result ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Invite sent</h2>
            <p className="text-sm text-slate-600 mb-4">
              Share these details with the invitee. Password is shown once.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm font-mono">
              <div className="text-emerald-700 text-xs uppercase">Login URL</div>
              <div className="mb-2 text-slate-900">
                {typeof window !== "undefined" ? window.location.origin : ""}/login
              </div>
              <div className="text-emerald-700 text-xs uppercase">Email</div>
              <div className="mb-2 text-slate-900">{result.email}</div>
              <div className="text-emerald-700 text-xs uppercase">Temporary password</div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900">{result.tempPassword}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(result.tempPassword);
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
              onClick={done}
              className="mt-4 w-full rounded-full bg-red-600 text-white py-2 text-sm font-medium hover:bg-red-700"
            >
              Done
            </button>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Invite a team member</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800 mb-3">{error}</div>
            )}

            <label className="block text-sm font-medium text-slate-700 mb-1 mt-3">Full name</label>
            <input
              name="full_name"
              type="text"
              required
              placeholder="Jane Doe"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <label className="block text-sm font-medium text-slate-700 mb-1 mt-3">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="jane@acme.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <label className="block text-sm font-medium text-slate-700 mb-1 mt-3">Role</label>
            <select
              name="role"
              defaultValue="technician"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="org_admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="technician">Technician</option>
              <option value="requester">Requester</option>
            </select>

            <button
              type="submit"
              disabled={busy}
              className="mt-5 w-full rounded-full bg-red-600 text-white py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create invite"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
