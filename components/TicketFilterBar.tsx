"use client";

// Search + advanced filter bar for the admin ticket queue.
// Pushes selections into URL search params so navigation is bookmarkable
// and the server component re-fetches with them.

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";

interface Option { id: string; name: string }

export function TicketFilterBar({
  clients, categories,
}: {
  clients: Option[];
  categories: Option[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  function push(patch: Record<string, string>) {
    const next = new URLSearchParams(Array.from(params.entries()));
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.push(`/admin/tickets?${next.toString()}`));
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    push({ q });
  }

  const activeCount =
    ["q", "priority", "client_id", "category_id"].filter((k) => params.get(k)).length;

  return (
    <div className="space-y-2 mb-4">
      <form onSubmit={submitSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ticket number, title, or description…"
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {q && (
            <button
              type="button"
              onClick={() => { setQ(""); push({ q: "" }); }}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-800"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand hover:bg-brand-600 text-white rounded-lg px-4 text-sm font-medium disabled:opacity-60"
        >
          Search
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select
          value={params.get("priority") ?? ""}
          onChange={(e) => push({ priority: e.target.value })}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm bg-white"
        >
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={params.get("client_id") ?? ""}
          onChange={(e) => push({ client_id: e.target.value })}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm bg-white"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={params.get("category_id") ?? ""}
          onChange={(e) => push({ category_id: e.target.value })}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => push({ q: "", priority: "", client_id: "", category_id: "" })}
            className="rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-2 py-1.5 text-sm inline-flex items-center justify-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Clear filters ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
