import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { getFeedbackList, type FeedbackListRow } from "@/lib/feedback-list-data";
import { Star, ArrowLeft, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

interface SP {
  rating?: string;
  technician?: string;
  client?: string;
  from?: string;
  to?: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-SG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star key={v} className={"w-3.5 h-3.5 " + (v <= n ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
      ))}
    </span>
  );
}

export default async function AdminFeedbackList({ searchParams }: { searchParams: Promise<SP> }) {
  const profile = await requireProfile(["admin", "manager"]);
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: techs }, { data: clients }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("role", ["technician", "manager"]).eq("is_active", true).order("full_name"),
    supabase.from("clients").select("id, name, location").eq("is_active", true).order("name"),
  ]);

  const rows: FeedbackListRow[] = await getFeedbackList({
    rating: sp.rating ? Number(sp.rating) : undefined,
    technicianId: sp.technician || undefined,
    clientId: sp.client || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
  });

  const avg = rows.length ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10 : null;

  return (
    <AppShell profile={profile}>
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold">Customer feedback</h1>
        {avg !== null && (
          <span className="ml-auto text-sm text-slate-600">
            <span className="font-semibold">{avg}</span> / 5 avg · {rows.length} ratings
          </span>
        )}
      </div>

      <form method="GET" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card mb-4 grid md:grid-cols-5 gap-3 text-sm">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Rating</label>
          <select name="rating" defaultValue={sp.rating ?? ""} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 bg-white">
            <option value="">All</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Technician</label>
          <select name="technician" defaultValue={sp.technician ?? ""} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 bg-white">
            <option value="">All</option>
            {(techs ?? []).map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Estate</label>
          <select name="client" defaultValue={sp.client ?? ""} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 bg-white">
            <option value="">All</option>
            {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.location}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
          <input type="date" name="from" defaultValue={sp.from ?? ""} className="w-full rounded-lg border border-slate-300 px-2 py-1.5" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
          <input type="date" name="to" defaultValue={sp.to ?? ""} className="w-full rounded-lg border border-slate-300 px-2 py-1.5" />
        </div>
        <div className="md:col-span-5 flex gap-2">
          <button type="submit" className="bg-brand hover:bg-brand-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium">Apply</button>
          <Link href="/admin/feedback" className="border border-slate-300 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-slate-50">Clear</Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          No feedback matches these filters yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left p-3">Rating</th>
                <th className="text-left p-3">Ticket</th>
                <th className="text-left p-3">Estate</th>
                <th className="text-left p-3">Technician</th>
                <th className="text-left p-3">Comment</th>
                <th className="text-left p-3">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3"><Stars n={r.rating} /></td>
                  <td className="p-3">
                    {r.ticket ? (
                      <Link href={`/admin/tickets/${r.ticket.id}`} className="text-brand hover:underline">
                        <span className="font-mono text-xs">{r.ticket.ticket_number}</span>
                        <div className="text-slate-700 text-xs truncate max-w-[200px]">{r.ticket.title}</div>
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="p-3 text-slate-700">{r.ticket?.client_name ?? "—"}</td>
                  <td className="p-3 text-slate-700">{r.ticket?.assignee_name ?? "—"}</td>
                  <td className="p-3 text-slate-700 max-w-[300px]">
                    {r.comment ? <span className="italic">&ldquo;{r.comment}&rdquo;</span> : <span className="text-slate-400">—</span>}
                    {r.would_recommend === false && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                        Would not recommend
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{fmt(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
