import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TechnicianActiveToggle } from "@/components/TechnicianActiveToggle";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PlusCircle, Pencil, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

interface TechRow {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  technician_trades: { category: { name: string } | null }[];
}

export default async function AdminTechniciansPage() {
  const profile = await requireProfile(["admin"]);
  const supabase = await createClient();

  const { data: techs } = await supabase
    .from("profiles")
    .select(`
      id, full_name, phone, is_active,
      technician_trades:technician_trades!technician_id(category:ticket_categories(name))
    `)
    .eq("role", "technician")
    .order("is_active", { ascending: false })
    .order("full_name")
    .returns<TechRow[]>();

  const rows = techs ?? [];

  return (
    <AppShell profile={profile}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Technicians</h1>
        <Link
          href="/admin/technicians/new"
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          Add technician
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          No technicians yet. Add your first one to start assigning tickets.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((t) => {
            const trades = (t.technician_trades ?? [])
              .map((tt) => tt.category?.name)
              .filter(Boolean) as string[];
            return (
              <div
                key={t.id}
                className={
                  t.is_active
                    ? "bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
                    : "bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3 opacity-75"
                }
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{t.full_name}</span>
                    {!t.is_active && (
                      <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">
                        Inactive
                      </span>
                    )}
                  </div>
                  {t.phone && (
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {t.phone}
                    </div>
                  )}
                  {trades.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {trades.map((name) => (
                        <span
                          key={name}
                          className="text-xs bg-brand-50 text-brand rounded-full px-2 py-0.5 border border-brand-100"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Link
                    href={`/admin/technicians/${t.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-2.5 py-1 text-xs font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <TechnicianActiveToggle technicianId={t.id} isActive={t.is_active} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
