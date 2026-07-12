import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireProfile } from "@/lib/guard";
import { getMyRatingsSummary } from "@/lib/feedback-list-data";
import { Star, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star key={v} className={"w-4 h-4 " + (v <= n ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
      ))}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function MyRatingsPage() {
  const profile = await requireProfile(["technician"]);
  const { avg, count, last } = await getMyRatingsSummary();

  return (
    <AppShell profile={profile}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold">
          {profile.role === "manager" ? "All ratings" : "My ratings"}
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
          <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold mb-1">Average rating</div>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold text-slate-900">{avg ?? "—"}</div>
            {avg !== null && <span className="text-sm text-slate-500">/ 5</span>}
          </div>
          {avg !== null && <div className="mt-2"><Stars n={Math.round(avg)} /></div>}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
          <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold mb-1">Total ratings</div>
          <div className="text-3xl font-bold text-slate-900">{count}</div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-800 mb-3">Recent feedback</h2>
      {last.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          No ratings yet. Once a customer rates one of your resolved tickets, it will show up here.
        </div>
      ) : (
        <div className="space-y-2">
          {last.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Stars n={r.rating} />
                  <span className="text-sm font-semibold text-slate-800">{r.rating} / 5</span>
                  {r.would_recommend === true && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Recommends
                    </span>
                  )}
                  {r.would_recommend === false && (
                    <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Would not recommend
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{fmt(r.created_at)}</span>
              </div>
              {r.comment && (
                <blockquote className="border-l-4 border-brand pl-3 text-sm text-slate-700 italic mt-2">
                  &ldquo;{r.comment}&rdquo;
                </blockquote>
              )}
              {r.ticket && (
                <div className="mt-2">
                  <Link href={`/technician/jobs/${r.ticket.id}`} className="text-xs text-brand hover:underline font-mono">
                    {r.ticket.ticket_number}
                  </Link>
                  <span className="text-xs text-slate-600 ml-2">{r.ticket.title}</span>
                  {r.ticket.client_name && <span className="text-xs text-slate-500 ml-2">· {r.ticket.client_name}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
