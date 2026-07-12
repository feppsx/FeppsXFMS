// Read-only display of a submitted feedback row. Shown on admin / tech / manager
// ticket detail pages. Server component — no client-side interactivity.
import { Star } from "lucide-react";
import type { TicketFeedback } from "@/lib/db-types-feedback";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-SG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function FeedbackView({
  feedback,
  submitterName,
}: {
  feedback: TicketFeedback | null;
  submitterName?: string | null;
}) {
  if (!feedback) {
    return (
      <p className="text-xs text-slate-500">
        Awaiting customer feedback. The requester can rate this after the ticket is marked resolved.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((v) => (
          <Star
            key={v}
            className={"w-5 h-5 " + (v <= feedback.rating ? "fill-amber-400 text-amber-400" : "text-slate-300")}
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-slate-800">{feedback.rating} / 5</span>
        {feedback.would_recommend === true && (
          <span className="ml-3 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Recommends
          </span>
        )}
        {feedback.would_recommend === false && (
          <span className="ml-3 inline-flex items-center rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Would not recommend
          </span>
        )}
      </div>

      {feedback.comment && (
        <blockquote className="border-l-4 border-brand pl-3 text-sm text-slate-700 italic">
          &ldquo;{feedback.comment}&rdquo;
        </blockquote>
      )}

      <div className="text-xs text-slate-500">
        {submitterName ? `${submitterName} · ` : ""}{fmt(feedback.created_at)}
      </div>
    </div>
  );
}
