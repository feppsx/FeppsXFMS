"use client";

// Form for creating a new organization + first org_admin in one shot.
// After success, shows the temp password once so platform admin can share it.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrganization } from "@/lib/actions/organizations";
import { Copy, Check } from "lucide-react";

export function CreateOrgForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ orgId: string; adminEmail: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createOrganization(fd);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    if (res.orgId && res.adminEmail && res.tempPassword) {
      setResult({ orgId: res.orgId, adminEmail: res.adminEmail, tempPassword: res.tempPassword });
    }
  }

  if (result) {
    return (
      <div className="max-w-xl">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-4">
          <div className="font-semibold text-emerald-900 mb-2">Organization created</div>
          <p className="text-sm text-emerald-800 mb-4">
            Share these credentials with the customer. This password is shown ONCE — copy it now.
          </p>
          <div className="bg-white rounded-lg p-3 text-sm font-mono">
            <div className="text-slate-500 text-xs">Login URL</div>
            <div className="mb-3">{typeof window !== "undefined" ? window.location.origin : ""}/login</div>
            <div className="text-slate-500 text-xs">Email</div>
            <div className="mb-3">{result.adminEmail}</div>
            <div className="text-slate-500 text-xs">Temporary password</div>
            <div className="flex items-center gap-2">
              <span>{result.tempPassword}</span>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(result.tempPassword);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/platform/organizations/${result.orgId}`)}
            className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Open organization
          </button>
          <button
            type="button"
            onClick={() => router.push("/platform/organizations")}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Organization name</label>
        <input
          name="name"
          type="text"
          required
          placeholder="Acme Facilities"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Slug <span className="text-slate-400 font-normal">(URL identifier — auto if blank)</span>
        </label>
        <input
          name="slug"
          type="text"
          placeholder="acme"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <p className="text-xs text-slate-500 mt-1">Lowercase letters, digits, hyphens.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
        <select
          name="plan"
          defaultValue="pro"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <hr className="border-slate-200" />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">First org admin — full name</label>
        <input
          name="admin_full_name"
          type="text"
          required
          placeholder="Jane Doe"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">First org admin — email</label>
        <input
          name="admin_email"
          type="email"
          required
          placeholder="jane@acme.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <p className="text-xs text-slate-500 mt-1">
          A temporary password will be generated and shown once. Share it with the customer.
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-red-600 text-white py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create organization"}
      </button>
    </form>
  );
}
