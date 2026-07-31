// Platform admin dashboard — high-level counters across every org.
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Building2, Users, Ticket, PauseCircle } from "lucide-react";

export const dynamic = "force-dynamic";

async function loadStats() {
  const admin = createAdminClient();
  const [orgsAll, orgsActive, orgsSuspended, profiles, tickets] = await Promise.all([
    admin.from("organizations").select("id", { count: "exact", head: true }),
    admin.from("organizations").select("id", { count: "exact", head: true }).eq("is_active", true).eq("is_suspended", false),
    admin.from("organizations").select("id", { count: "exact", head: true }).eq("is_suspended", true),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("tickets").select("id", { count: "exact", head: true }),
  ]);
  return {
    totalOrgs:     orgsAll.count      ?? 0,
    activeOrgs:    orgsActive.count   ?? 0,
    suspendedOrgs: orgsSuspended.count ?? 0,
    totalUsers:    profiles.count     ?? 0,
    totalTickets:  tickets.count      ?? 0,
  };
}

export default async function PlatformDashboardPage() {
  const s = await loadStats();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Platform overview</h1>
        <p className="text-sm text-slate-500 mt-1">Cross-organization health at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2}    label="Total orgs"     value={s.totalOrgs}     />
        <StatCard icon={Building2}    label="Active"         value={s.activeOrgs}    tone="green" />
        <StatCard icon={PauseCircle}  label="Suspended"      value={s.suspendedOrgs} tone={s.suspendedOrgs ? "red" : "muted"} />
        <StatCard icon={Users}        label="Users (all)"    value={s.totalUsers}    />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Ticket} label="Total tickets" value={s.totalTickets} />
        <Link
          href="/platform/organizations"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:bg-slate-50 flex items-center justify-between"
        >
          <div>
            <div className="text-sm text-slate-500">Manage</div>
            <div className="text-lg font-semibold text-slate-900">Organizations</div>
          </div>
          <Building2 className="w-6 h-6 text-red-600" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "default" | "green" | "red" | "muted";
}) {
  const toneCls =
    tone === "green" ? "text-emerald-600" :
    tone === "red"   ? "text-red-600"     :
    tone === "muted" ? "text-slate-400"   :
                       "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className={`text-3xl font-semibold ${toneCls}`}>{value}</div>
    </div>
  );
}
