import type { TicketStatusHistoryRow } from "@/lib/db-types";
import { StatusBadge } from "./StatusBadge";

/** Render the ticket_status_history rows as a vertical timeline. */
export function TicketTimeline({
  history,
  actors,
}: {
  history: TicketStatusHistoryRow[];
  actors: Record<string, string>;   // profile_id -> display name
}) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-500">No status changes yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {history.map((h) => (
        <li key={h.id} className="flex gap-3">
          <div className="flex flex-col items-center pt-1">
            <div className="w-2 h-2 rounded-full bg-brand" />
            <div className="w-px flex-1 bg-slate-200 mt-1" />
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={h.to_status} />
              <span className="text-xs text-slate-500">
                {new Date(h.created_at).toLocaleString("en-SG", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {h.changed_by && actors[h.changed_by] && (
              <div className="text-xs text-slate-500 mt-0.5">by {actors[h.changed_by]}</div>
            )}
            {h.notes && <div className="text-sm text-slate-700 mt-1">{h.notes}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
