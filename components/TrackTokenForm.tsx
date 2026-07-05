"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

export function TrackTokenForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase().replace(/\s/g, "");
    if (!normalized) return;
    setBusy(true);
    router.push(`/track/${normalized}`);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium">Tracking code</label>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="TRK-XXXXXXXX"
        autoFocus
        autoCapitalize="characters"
        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <button
        type="submit"
        disabled={busy || !code.trim()}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-white font-medium rounded-lg px-4 py-2.5 disabled:opacity-60 shadow-card"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        View status
      </button>
    </form>
  );
}
