import { cn } from "@/lib/utils";
import type { TicketPriority } from "@/lib/db-types";

const PRIORITY_META: Record<TicketPriority, { label: string; className: string }> = {
  low:    { label: "Low",    className: "bg-slate-50 text-slate-600 border-slate-200" },
  medium: { label: "Medium", className: "bg-sky-50 text-sky-700 border-sky-200" },
  high:   { label: "High",   className: "bg-orange-50 text-orange-700 border-orange-200" },
  urgent: { label: "Urgent", className: "bg-red-50 text-red-700 border-red-200" },
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
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
