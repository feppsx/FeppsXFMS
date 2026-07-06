"use client";

// Compact schedule editor shown on the ticket detail page.
// Uses HTML5 datetime-local + a number input for duration.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setTicketSchedule } from "@/lib/actions/schedule";
import { Calendar, Save, X, Loader2 } from "lucide-react";

/** Convert an ISO timestamp (or null) to the local YYYY-MM-DDTHH:MM string
 * that <input type="datetime-local"> expects. */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Inverse — parse a local input into an ISO string. */
function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function fmtDisplay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-SG", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduleWidget({
  ticketId,
  scheduledAt,
  durationMinutes,
}: {
  ticketId: string;
  scheduledAt: string | null;
  durationMinutes: number;
}) {
  const [when, setWhen] = useState(() => isoToLocalInput(scheduledAt));
  const [duration, setDuration] = useState(durationMinutes || 60);
  const [isPending, startTransition] = useTransition();

  function save() {
    const iso = localInputToIso(when);
    startTransition(async () => {
      const res = await setTicketSchedule(ticketId, iso, duration);
      if (res.error) toast.error(res.error);
      else toast.success(iso ? "Visit scheduled" : "Schedule cleared");
    });
  }

  function clear() {
    setWhen("");
    startTransition(async () => {
      const res = await setTicketSchedule(ticketId, null, duration);
      if (res.error) toast.error(res.error);
      else toast.success("Schedule cleared");
    });
  }

  return (
    <div className="space-y-2">
      {scheduledAt && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Currently scheduled: <span className="font-medium">{fmtDisplay(scheduledAt)}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Visit date &amp; time</label>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Duration (minutes)
        </label>
        <input
          type="number"
          min={15}
          max={480}
          step={15}
          value={duration}
          onChange={(e) => setDuration(Math.max(15, parseInt(e.target.value) || 60))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={isPending || !when}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {scheduledAt ? "Update" : "Schedule"}
        </button>
        {scheduledAt && (
          <button
            type="button"
            onClick={clear}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 text-sm font-medium disabled:opacity-60"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Requesters see this on their tracking page when set.
      </p>
    </div>
  );
}
