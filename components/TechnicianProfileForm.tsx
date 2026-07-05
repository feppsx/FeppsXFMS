"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOwnProfile } from "@/lib/actions/profile";
import { SignatureUpload } from "@/components/SignatureUpload";
import { Loader2, Save } from "lucide-react";
import type { Profile } from "@/lib/db-types";

export function TechnicianProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [fullName,  setFullName]  = useState(profile.full_name);
  const [phone,     setPhone]     = useState(profile.phone ?? "");
  const [signature, setSignature] = useState<string | null>(profile.signature_path);
  const [error,     setError]     = useState<string | null>(null);
  const [saved,     setSaved]     = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!fullName.trim()) return setError("Name is required.");

    const fd = new FormData();
    fd.set("full_name",      fullName);
    fd.set("phone",          phone);
    fd.set("signature_path", signature ?? "");

    startTransition(async () => {
      const res = await updateOwnProfile(fd);
      if (res.error) { setError(res.error); return; }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+65 9000 0000"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Signature <span className="text-xs font-normal text-slate-500">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Appears on the &ldquo;Technical Team Leader&rdquo; line of invoices you generate.
        </p>
        <SignatureUpload
          userId={profile.id}
          value={signature}
          onChange={setSignature}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {saved && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          Profile saved.
        </div>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-medium rounded-lg px-5 py-2.5 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>
    </form>
  );
}
