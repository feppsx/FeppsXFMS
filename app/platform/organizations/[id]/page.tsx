import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Ticket, Receipt, Building2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Organization, Profile } from "@/lib/db-types";
import { OrgDetailActions } from "@/components/OrgDetailActions";

export const dynamic = "force-dynamic";

const SEED_ORG_ID = "00000000-0000-0000-0000-000000000360";

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("*")
    .eq("id", id)
    .maybeSingle<Organization>();

  if (!org) notFound();

  const [membersRes, ticketsRes, invoicesRes, clientsRes] = await Promise.all([
    admin.from("profiles").select("id, full_name, role").eq("organization_id", id),
    admin.from("tickets").select("id", { count: "exact", head: true }).eq("organization_id", id),
    admin.from("invoices").select("id", { count: "exact", head: true }).eq("organization_id", id),
    admin.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", id),
  ]);

  const members = ((membersRes.data ?? []) as unknown) as Pick<Profile, "id" | "full_name" | "role">[];

  return (
    <div>
      <Link
        href="/platform/organizations"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to organizations
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{org.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">{org.slug}</span>
            <span>·</span>
            <span className="capitalize">{org.plan} plan</span>
            <span>·</span>
            {org.is_suspended ? (
              <span className="text-red-700">Suspended</span>
            ) : org.is_active ? (
              <span className="text-emerald-700">Active</span>
            ) : (
              <span>Inactive</span>
            )}
          </div>
        </div>
        <OrgDetailActions
          orgId={org.id}
          isSuspended={org.is_suspended}
          canDelete={org.id !== SEED_ORG_ID}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MiniStat icon={Users}     label="Team"     value={members.length} />
        <MiniStat icon={Ticket}    label="Tickets"  value={ticketsRes.count ?? 0} />
        <MiniStat icon={Receipt}   label="Invoices" value={invoicesRes.count ?? 0} />
        <MiniStat icon={Building2} label="Estates"  value={clientsRes.count ?? 0} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Team members</h2>
        </div>
        {members.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">No members yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-2">Name</th>
                <th className="text-left px-5 py-2">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-2 text-slate-900">{m.full_name}</td>
                  <td className="px-5 py-2 text-slate-600 capitalize">{m.role.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
    </div>
  );
}
