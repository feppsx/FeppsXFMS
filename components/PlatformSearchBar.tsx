"use client";

// Live-search box for the platform admin header. Debounced 200ms.
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, User, Ticket, Receipt } from "lucide-react";

interface Hit {
  kind: "org" | "user" | "ticket" | "invoice";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const ICONS = {
  org:     Building2,
  user:    User,
  ticket:  Ticket,
  invoice: Receipt,
};

export function PlatformSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced fetch.
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/platform/search?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        setHits(json.hits ?? []);
      } catch { /* ignore */ }
      setBusy(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [q]);

  const grouped = {
    org:     hits.filter((h) => h.kind === "org"),
    user:    hits.filter((h) => h.kind === "user"),
    ticket:  hits.filter((h) => h.kind === "ticket"),
    invoice: hits.filter((h) => h.kind === "invoice"),
  };

  const groupLabels: Record<Hit["kind"], string> = {
    org:     "Organizations",
    user:    "Users",
    ticket:  "Tickets",
    invoice: "Invoices",
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search orgs, users, tickets, invoices…"
        className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
      />

      {open && q.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-40 max-h-[70vh] overflow-y-auto">
          {busy && hits.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500 text-center">Searching…</div>
          ) : hits.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500 text-center">No results.</div>
          ) : (
            (Object.keys(grouped) as Array<Hit["kind"]>).map((kind) => {
              const items = grouped[kind];
              if (items.length === 0) return null;
              const Icon = ICONS[kind];
              return (
                <div key={kind}>
                  <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    {groupLabels[kind]}
                  </div>
                  {items.map((h) => (
                    <button
                      key={`${kind}-${h.id}`}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setQ("");
                        router.push(h.href);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-start gap-3"
                    >
                      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{h.title}</div>
                        <div className="text-xs text-slate-500 truncate">{h.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
