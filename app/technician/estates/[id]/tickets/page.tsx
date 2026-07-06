import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TicketRow, type TicketRowData } from "@/components/TicketRow";
import { TicketRealtime } from "@/components/TicketRealtime";
import { EmptyState } from "@/components/EmptyState";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { Estate, TicketStatus } from "@/lib/db-types";
import { ArrowLeft, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string; statuses: TicketStatus[] | null }[] = [
  { key: "raised",   label: "Raised",   statuses: ["submitted", "assigned", "in_progress", "on_hold", "reopened"] },
  { key: "resolved", label: "Resolved", statuses: ["resolved", "closed"] },
  { key: "all",      label: "All",      statuses: null },
];

const CATEGORY_COLOR: Record<string, string> = {
  Retail: "bg-orange-100 text-orange-700 border-orange-200",
  MCST:   "bg-brand-100  text-brand-700  border-brand-200",
  SBS:    "bg-purple-100 text-purple-700 border-purple-200",
};

export default async function TechEstateTicketsPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const profile = await requireProfile(["technician", "manager"]);
  const { id } = await params;
  const { filter: filterKey = "raised" } = await searchParams;
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];

  const supabase = await createClient();
  const { data: estate } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle<Estate>();
  if (!estate) notFound();

  // RLS filters tickets for technicians to their assigned ones; managers see all.
  let query = supabase
    .from("tickets")
    .select(`
      *,
      category:ticket_categories(name, color),
      client:clients(name, location),
      tenant:client_tenants(name)
    `)
    .eq("client_id", id)
    .order("created_at", { ascending: false });
  if (filter.statuses) query = query.in("status", filter.statuses);

  const { data: tickets } = await query.limit(200).returns<TicketRowData[]>();
  const rows = tickets ?? [];

  const catCls =
    CATEGORY_COLOR[estate.category] ?? "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <AppShell profile={profile}>
      <TicketRealtime listMode />
      <Link
        href="/technician/estates"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to estates
      </Link>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-900 truncate">{estate.name}</h1>
            <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " + catCls}>
              {estate.category}
            </span>
          </div>
          <div className="text-sm text-slate-500">{estate.location}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/technician/estates/${id}/tickets?filter=${f.key}`}
            className={
              f.key === filter.key
                ? "text-sm rounded-full bg-brand text-white px-3 py-1"
                : "text-sm rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1"
            }
          >
            {f.label}
          </Link>
        ))}
        <div className="ml-auto text-xs text-slate-500 self-center">{rows.length} shown</div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          variant="tickets"
          title="No tickets in this view"
          message={`No ${filter.label.toLowerCase()} tickets for ${estate.name} · ${estate.location} right now.`}
        />
      ) : (
        <div className="space-y-2">
          {rows.map((t) => (
            <TicketRow key={t.id} ticket={t} hrefBase="/technician/jobs" />
          ))}
        </div>
      )}
    </AppShell>
  );
}
