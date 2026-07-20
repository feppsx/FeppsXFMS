"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function TrackTokenForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = token.trim().toUpperCase();
    if (!t) { setError("Please enter your ticket ID."); return; }
    setError(null);
    startTransition(() => router.push(`/track/${t}`));
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-2">Enter Ticket ID</label>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter Ticket ID"
          autoFocus
          className="w-full rounded-full bg-input-bg px-5 py-3 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="pt-2 flex justify-center">
        <button
          type="submit" disabled={isPending}
          className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white text-base font-semibold rounded-full px-10 py-3 shadow-float disabled:opacity-60"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          CHECK STATUS
        </button>
      </div>
    </form>
  );
}
