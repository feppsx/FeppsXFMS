import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ClientActiveToggle } from "@/components/ClientActiveToggle";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PlusCircle, MapPin, Pencil } from "lucide-react";
import type { Client } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const profile = await requireProfile(["admin"]);
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name")
    .order("location")
    .returns<Client[]>();

  const rows = clients ?? [];

  return (
    <AppShell profile={profile}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Estates</h1>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          Add estate
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          No estates yet. Add your first one so requesters can raise tickets.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <div
              key={c.id}
              className={
                c.is_active
                  ? "bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
                  : "bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3 opacity-75"
              }
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{c.name}</span>
                  {!c.is_active && (
                    <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {c.location}
                </div>
                {c.address && (
                  <div className="text-xs text-slate-500 mt-0.5">{c.address}</div>
                )}
                {(c.contact_email || c.contact_phone) && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {c.contact_email && <span>{c.contact_email}</span>}
                    {c.contact_email && c.contact_phone && <span> · </span>}
                    {c.contact_phone && <span>{c.contact_phone}</span>}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Link
                  href={`/admin/clients/${c.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-2.5 py-1 text-xs font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <ClientActiveToggle clientId={c.id} isActive={c.is_active} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
