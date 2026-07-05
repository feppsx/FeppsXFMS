import { AppShell } from "@/components/AppShell";
import { TicketRow, type TicketRowData } from "@/components/TicketRow";
import { TicketRealtime } from "@/components/TicketRealtime";
import { TicketFilterBar } from "@/components/TicketFilterBar";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import type { TicketStatus } from "@/lib/db-types";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string; statuses: TicketStatus[] | null }[] = [
  { key: "open",     label: "Open",        statuses: ["submitted", "assigned", "in_progress", "on_hold", "reopened"] },
  { key: "new",      label: "New",         statuses: ["submitted"] },
  { key: "assigned", label: "In progress", statuses: ["assigned", "in_progress", "on_hold"] },
  { key: "resolved", label: "Resolved",    statuses: ["resolved"] },
  { key: "all",      label: "All",         statuses: null },
];

interface SP {
  filter?: string;
  q?: string;
  priority?: string;
  client_id?: string;
  category_id?: string;
}

export default async function AdminTicketQueue({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const profile = await requireProfile(["admin"]);
  const sp = await searchParams;
  const filter = FILTERS.find((f) => f.key === (sp.filter ?? "open")) ?? FILTERS[0];

  const supabase = await createClient();

  // For filter dropdowns
  const [{ data: clients }, { data: categories }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("is_active", true).order("name"),
    supabase.from("ticket_categories").select("id, name").eq("is_active", true).order("name"),
  ]);

  // Build ticket query
  let query = supabase
    .from("tickets")
    .select(`
      *,
      category:ticket_categories(name, color),
      client:clients(name, location),
      tenant:client_tenants(name)
    `)
    .order("created_at", { ascending: false });

  if (filter.statuses) query = query.in("status", filter.statuses);
  if (sp.priority)     query = query.eq("priority", sp.priority);
  if (sp.client_id)    query = query.eq("client_id", sp.client_id);
  if (sp.category_id)  query = query.eq("category_id", sp.category_id);
  if (sp.q) {
    const term = sp.q.trim();
    if (term) {
      // ilike works on ticket_number, title, description; client name searched separately via join is complex,
      // so we OR across the three ticket-level columns.
      query = query.or(`ticket_number.ilike.%${term}%,title.ilike.%${term}%,description.ilike.%${term}%`);
    }
  }

  const { data: tickets } = await query.limit(200).returns<TicketRowData[]>();
  const rows = tickets ?? [];

  // Serialize the sub-filter params so status chips preserve them
  const chipParams = new URLSearchParams();
  if (sp.q)           chipParams.set("q", sp.q);
  if (sp.priority)    chipParams.set("priority", sp.priority);
  if (sp.client_id)   chipParams.set("client_id", sp.client_id);
  if (sp.category_id) chipParams.set("category_id", sp.category_id);

  return (
    <AppShell profile={profile}>
      <TicketRealtime listMode />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Ticket queue</h1>
        <div className="text-xs text-slate-500">{rows.length} shown</div>
      </div>

      <TicketFilterBar clients={clients ?? []} categories={categories ?? []} />

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => {
          const p = new URLSearchParams(chipParams);
          p.set("filter", f.key);
          return (
            <Link
              key={f.key}
              href={`/admin/tickets?${p.toString()}`}
              className={
                f.key === filter.key
                  ? "text-sm rounded-full bg-brand text-white px-3 py-1"
                  : "text-sm rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          variant="tickets"
          title="No tickets match these filters"
          message="Try clearing filters or picking a different status."
        />
      ) : (
        <div className="space-y-2">
          {rows.map((t) => (
            <TicketRow key={t.id} ticket={t} hrefBase="/admin/tickets" />
          ))}
        </div>
      )}
    </AppShell>
  );
}
