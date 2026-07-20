"use client";

// Filter chip bar + list for /technician/jobs. Filters run client-side on the
// server-fetched row set. Empty state matches the mockup ("No jobs here right now").

import { useState, useMemo } from "react";
import Link from "next/link";
import type { TicketRowData } from "./TicketRow";
import type { TicketStatus } from "@/lib/db-types";
import { Building2 } from "lucide-react";

interface Filter {
  key: string;
  label: string;
  match: (t: TicketRowData) => boolean;
}

const FILTERS: Filter[] = [
  { key: "all",         label: "All",         match: () => true },
  { key: "new",         label: "New",         match: (t) => t.status === "submitted" },
  { key: "assigned",    label: "Assigned",    match: (t) => t.status === "assigned" },
  { key: "in_progress", label: "In Progress", match: (t) => t.status === "in_progress" },
  { key: "resolved",    label: "Resolved",    match: (t) => t.status === "resolved" || t.status === "closed" },
];

function money(_status: TicketStatus) { return null; } // reserved
void money;

function fmtWhen(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-SG", { day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${day} · ${time}`;
}

export function TechJobsFilters({ rows }: { rows: TicketRowData[] }) {
  const [active, setActive] = useState<string>("all");

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const f of FILTERS) m[f.key] = rows.filter(f.match).length;
    return m;
  }, [rows]);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === active) ?? FILTERS[0];
    return rows.filter(f.match);
  }, [rows, active]);

  return (
    <div>
      {/* Filter chips — horizontal scroll on mobile */}
      <div className="-mx-4 md:mx-0 mb-4">
        <div className="flex gap-2 overflow-x-auto px-4 md:px-0 pb-1 no-scrollbar">
          {FILTERS.map((f) => {
            const on = active === f.key;
            const c = counts[f.key];
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActive(f.key)}
                className={
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition " +
                  (on
                    ? "bg-chip-blue text-slate-900 border-slate-300"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
                }
              >
                {f.label} {c > 0 && <span className="ml-1 opacity-70">({c})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 text-xl text-slate-700">No jobs here right now</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <JobCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ t }: { t: TicketRowData }) {
  const category = t.category?.name ?? "General";
  const isUrgent = t.priority === "urgent";
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4">
      {/* category badge (top) */}
      <div className="mb-2">
        <span className="inline-flex items-center rounded-full bg-danger-red text-danger-red-text px-3 py-0.5 text-xs font-semibold">
          {category}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 text-brand-blue">
            <Building2 className="w-4 h-4" />
            <span className="font-semibold truncate">{t.client?.name ?? "Estate"}</span>
          </div>
        </div>
        {isUrgent && (
          <span className="inline-flex items-center rounded-full bg-danger-red text-danger-red-text px-3 py-0.5 text-xs font-bold uppercase tracking-wide">
            Urgent
          </span>
        )}
      </div>

      <h3 className="text-danger-red-text font-semibold text-base mb-1">{t.title}</h3>
      <p className="text-sm text-slate-600 line-clamp-3">{t.description}</p>

      <div className="mt-3 text-xs text-slate-500">
        {fmtWhen(t.created_at)}
      </div>

      <div className="mt-3">
        <Link
          href={`/technician/jobs/${t.id}`}
          className="block text-center rounded-full border-2 border-brand-blue text-brand-blue font-semibold py-2 hover:bg-brand-blue hover:text-white transition"
        >
          JOB DETAILS
        </Link>
      </div>
    </div>
  );
}
