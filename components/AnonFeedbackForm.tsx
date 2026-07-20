"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitAnonFeedback } from "@/lib/actions/anon-feedback";
import { Star, Loader2, CheckCircle2 } from "lucide-react";

export function AnonFeedbackForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) { setError("Please pick a rating first."); return; }
    startTransition(async () => {
      const res = await submitAnonFeedback({ token, rating, would_recommend: recommend, comment });
      if (res.error) { setError(res.error); toast.error(res.error); return; }
      toast.success("Thanks for the feedback!");
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-2xl font-bold text-slate-900">THANK YOU!</h3>
        <p className="text-slate-600 mt-2">Your feedback helps us keep improving our service.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Red star rating row */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((v) => {
          const filled = (hover || rating) >= v;
          return (
            <button
              key={v} type="button"
              onMouseEnter={() => setHover(v)} onMouseLeave={() => setHover(0)}
              onClick={() => setRating(v)}
              aria-label={`${v} star${v > 1 ? "s" : ""}`}
              className="p-1"
            >
              <Star
                className={"w-12 h-12 " + (filled ? "fill-brand-red text-brand-red" : "text-brand-red")}
                strokeWidth={2}
              />
            </button>
          );
        })}
      </div>

      {/* Comment */}
      <div>
        <label className="block text-lg font-semibold text-slate-900 mb-2">Comments</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Comments"
          className="w-full rounded-3xl bg-input-bg px-5 py-4 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>

      {/* Would-recommend toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-2">Would you recommend 360 Integrated?</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setRecommend(true)}
            className={"rounded-full px-6 py-2 text-sm font-semibold border " + (recommend === true ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "border-slate-300 text-slate-700 hover:bg-slate-50")}>
            Yes
          </button>
          <button type="button" onClick={() => setRecommend(false)}
            className={"rounded-full px-6 py-2 text-sm font-semibold border " + (recommend === false ? "bg-rose-50 border-rose-300 text-rose-800" : "border-slate-300 text-slate-700 hover:bg-slate-50")}>
            No
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="flex justify-center pt-2">
        <button type="submit" disabled={isPending}
          className="inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white text-base font-semibold rounded-full px-10 py-3 shadow-float disabled:opacity-60">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          SUBMIT FEEDBACK
        </button>
      </div>
    </form>
  );
}
