import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import { SimpleBarChart } from "@/components/SimpleBarChart";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { TicketRealtime } from "@/components/TicketRealtime";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { Ticket, TicketStatusHistoryRow } from "@/lib/db-types";
import { ArrowRight, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["submitted", "assigned", "in_progress", "on_hold", "reopened"];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function todayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

interface UrgentRow extends Ticket {
  client: { name: string; location: string } | null;
}

interface ActivityRow extends TicketStatusHistoryRow {
  ticket: { ticket_number: string; title: string } | null;
  changed_by_profile: { full_name: string } | null;
}

export default async function AdminDashboardPage() {
  const profile = await requireProfile(["admin"]);
  const supabase = await createClient();

  const [
    openCount, newTodayCount, resolvedWeekCount, urgentOpenCount, overdueCount,
    revenueThisMonth,
    { data: urgentTickets },
    { data: activity },
    { data: ticketsLast14 },
  ] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }).in("status", OPEN_STATUSES).then((r) => r.count ?? 0),
    supabase.from("tickets").select("id", { count: "exact", head: true }).gte("created_at", todayIso()).then((r) => r.count ?? 0),
    supabase.from("tickets").select("id", { count: "exact", head: true }).gte("resolved_at", startOfWeek().toISOString()).then((r) => r.count ?? 0),
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("priority", "urgent").in("status", OPEN_STATUSES).then((r) => r.count ?? 0),
    supabase.from("tickets").select("id", { count: "exact", head: true }).in("status", ["submitted", "assigned"]).lt("created_at", daysAgo(3).toISOString()).then((r) => r.count ?? 0),
    supabase.from("invoices").select("grand_total").eq("is_paid", true).gte("paid_at", startOfMonth().toISOString()).then((r) => (r.data ?? []).reduce((s: number, x: { grand_total: number }) => s + Number(x.grand_total || 0), 0)),
    supabase.from("tickets")
      .select("*, client:clients(name, location)")
      .eq("priority", "urgent").in("status", OPEN_STATUSES)
      .order("created_at", { ascending: false }).limit(5).returns<UrgentRow[]>(),
    supabase.from("ticket_status_history")
      .select("*, ticket:tickets(ticket_number, title), changed_by_profile:profiles!ticket_status_history_changed_by_fkey(full_name)")
      .order("created_at", { ascending: false }).limit(15).returns<ActivityRow[]>(),
    supabase.from("tickets").select("created_at").gte("created_at", daysAgo(13).toISOString()),
  ]);

  // Build "tickets per day" chart data for last 14 days
  const perDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    perDay.set(key, 0);
  }
  for (const t of ticketsLast14 ?? []) {
    const key = new Date(t.created_at).toISOString().slice(0, 10);
    if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const chartData = Array.from(perDay.entries()).map(([iso, value]) => ({
    label: new Date(iso).toLocaleDateString("en-SG", { day: "numeric" }),
    value,
  }));

  return (
    <AppShell profile={profile}>
      <TicketRealtime listMode />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link href="/admin/tickets" className="text-sm text-brand hover:underline inline-flex items-center gap-1">
          Go to ticket queue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Open tickets"      value={openCount}       href="/admin/tickets?filter=open" tone="brand" />
        <KpiCard label="New today"         value={newTodayCount}   href="/admin/tickets?filter=new" />
        <KpiCard label="Resolved this week"value={resolvedWeekCount} tone="emerald" />
        <KpiCard label="Urgent open"       value={urgentOpenCount} tone={urgentOpenCount > 0 ? "red" : "default"} href="/admin/tickets?filter=open&priority=urgent" />
        <KpiCard label="Overdue > 3 days"  value={overdueCount}    tone={overdueCount > 0 ? "amber" : "default"} hint="Submitted/Assigned only" />
        <KpiCard label="Revenue this month" value={`S$ ${revenueThisMonth.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} tone="emerald" hint="From paid invoices" href="/admin/invoices" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Left column: activity + chart */}
        <div className="md:col-span-2 space-y-4">
          <section className="bg-white border border-slate-200 rounded-2xl p-4">
            <h2 className="text-sm font-medium text-slate-500 mb-3">Tickets per day (last 14)</h2>
            <SimpleBarChart data={chartData} height={120} />
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-4">
            <h2 className="text-sm font-medium text-slate-500 mb-3">Recent activity</h2>
            {(activity ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Nothing yet.</p>
            ) : (
              <ol className="space-y-2">
                {(activity ?? []).map((a) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={a.to_status} />
                        <Link href={`/admin/tickets/${a.ticket_id}`} className="font-mono text-xs text-slate-500 hover:text-brand">
                          {a.ticket?.ticket_number ?? ""}
                        </Link>
                        <span className="text-slate-700 truncate">{a.ticket?.title ?? ""}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {a.changed_by_profile?.full_name ?? "System"} · {new Date(a.created_at).toLocaleString("en-SG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Right: urgent tickets */}
        <div className="space-y-4">
          <section className="bg-white border border-slate-200 rounded-2xl p-4">
            <h2 className="text-sm font-medium text-slate-500 mb-3 inline-flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-red-500" />
              Urgent — open
            </h2>
            {(urgentTickets ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Nothing urgent right now.</p>
            ) : (
              <ul className="space-y-2">
                {(urgentTickets ?? []).map((t) => (
                  <li key={t.id}>
                    <Link href={`/admin/tickets/${t.id}`} className="block border border-rose-100 bg-rose-50 rounded-lg px-3 py-2 hover:border-rose-300">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono">{t.ticket_number}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <div className="font-medium text-sm text-slate-900 truncate mt-0.5">{t.title}</div>
                      {t.client && (
                        <div className="text-xs text-slate-500 truncate">{t.client.name} · {t.client.location}</div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
