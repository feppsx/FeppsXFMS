import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ManagerActiveToggle } from "@/components/ManagerActiveToggle";
import { Avatar } from "@/components/Avatar";
import { requireProfile } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PlusCircle, Pencil, Phone, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface ManagerRow {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export default async function AdminManagersPage() {
  const profile = await requireProfile(["org_admin"]);
  const supabase = await createClient();

  const { data: managers } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url, is_active")
    .eq("role", "manager")
    .order("is_active", { ascending: false })
    .order("full_name")
    .returns<ManagerRow[]>();

  const rows = managers ?? [];

  return (
    <AppShell profile={profile}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold inline-flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand" />
          Managers
        </h1>
        <Link
          href="/admin/managers/new"
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          Add manager
        </Link>
      </div>

      <p className="text-sm text-slate-500 mb-4 max-w-2xl">
        Managers log into the same portal as technicians. They see and can act on tickets — use this
        role for oversight staff who don&apos;t need admin rights.
      </p>

      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          No managers yet. Add your first one to give them monitor access.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((m) => (
            <div
              key={m.id}
              className={
                m.is_active
                  ? "bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
                  : "bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3 opacity-75"
              }
            >
              <div className="min-w-0 flex items-start gap-3">
                <Avatar name={m.full_name} url={m.avatar_url} size={44} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{m.full_name}</span>
                    {!m.is_active && (
                      <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">
                        Inactive
                      </span>
                    )}
                  </div>
                  {m.phone && (
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {m.phone}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Link
                  href={`/admin/managers/${m.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 px-2.5 py-1 text-xs font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <ManagerActiveToggle managerId={m.id} isActive={m.is_active} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
