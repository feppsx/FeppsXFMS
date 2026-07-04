import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/db-types";

const STATUS_META: Record<TicketStatus, { label: string; className: string }> = {
  submitted:   { label: "Submitted",   className: "bg-slate-100 text-slate-700 border-slate-200" },
  assigned:    { label: "Assigned",    className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In progress", className: "bg-amber-50 text-amber-800 border-amber-200" },
  on_hold:     { label: "On hold",     className: "bg-orange-50 text-orange-800 border-orange-200" },
  resolved:    { label: "Resolved",    className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  closed:      { label: "Closed",      className: "bg-slate-100 text-slate-500 border-slate-200" },
  reopened:    { label: "Reopened",    className: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled:   { label: "Cancelled",   className: "bg-slate-100 text-slate-500 border-slate-200 line-through" },
};

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
