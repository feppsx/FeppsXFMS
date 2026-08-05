"use client";

// Requester-facing form. Shows 5 star buttons, Yes/No recommend toggle, and
// an optional comment field. Submits to /lib/actions/feedback.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitFeedback } from "@/lib/actions/feedback";
import { Star, Loader2, Send, CheckCircle2 } from "lucide-react";

export function FeedbackForm({ ticketId }: { ticketId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) { setError("Please pick a rating first."); return; }
    startTransition(async () => {
      const res = await submitFeedback({
        ticket_id: ticketId,
        rating,
        would_recommend: recommend,
        comment,
      });
      if (res.error) { setError(res.error); toast.error(res.error); return; }
      toast.success("Thanks for the feedback!");
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
        <h3 className="font-semibold text-slate-900">Thanks for the feedback!</h3>
        <p className="text-sm text-slate-600 mt-1">Your rating has been sent to the team.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">How was the service?</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((v) => {
            const filled = (hover || rating) >= v;
            return (
              <button
                key={v}
                type="button"
                onMouseEnter={() => setHover(v)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(v)}
                aria-label={`${v} star${v > 1 ? "s" : ""}`}
                className="p-1"
              >
                <Star className={"w-8 h-8 transition " + (filled ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
              </button>
            );
          })}
          <span className="ml-2 text-sm text-slate-500">{rating > 0 ? `${rating} / 5` : ""}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Would you recommend us?</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecommend(true)}
            className={"px-4 py-2 rounded-lg border text-sm font-medium " + (recommend === true ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "border-slate-300 text-slate-700 hover:bg-slate-50")}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setRecommend(false)}
            className={"px-4 py-2 rounded-lg border text-sm font-medium " + (recommend === false ? "bg-rose-50 border-rose-300 text-rose-800" : "border-slate-300 text-slate-700 hover:bg-slate-50")}
          >
            No
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Anything you'd like to add? <span className="text-slate-400 font-normal">(optional)</span></label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Was the technician polite? Was the fix clean? Anything for us to improve on?"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Submit feedback
      </button>
      <p className="text-xs text-slate-500">Feedback is final once submitted.</p>
    </form>
  );
}
