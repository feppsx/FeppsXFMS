import { AppShell } from "@/components/AppShell";
import { requireProfile } from "@/lib/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, PLAN_ORDER, planFor, STAFF_ROLES, type PlanId } from "@/lib/plans";
import { Check, X, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const profile = await requireProfile(["org_admin"]);
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, plan")
    .eq("id", profile.organization_id)
    .maybeSingle<{ id: string; name: string; plan: string }>();

  const monthStart = new Date();
  monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);

  const [staffRes, estatesRes, ticketsRes] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .in("role", STAFF_ROLES as unknown as string[]),
    admin.from("clients").select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id),
    admin.from("tickets").select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .gte("created_at", monthStart.toISOString()),
  ]);

  const current = planFor(org?.plan);
  const usage = {
    staff:            staffRes.count ?? 0,
    estates:          estatesRes.count ?? 0,
    ticketsThisMonth: ticketsRes.count ?? 0,
  };

  return (
    <AppShell profile={profile}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Billing &amp; plan</h1>
        <p className="text-sm text-slate-500 mt-1">
          You&apos;re currently on the <b className="text-slate-900">{current.name}</b> plan.
        </p>
      </div>

      {/* Usage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <UsageBar label="Staff seats" used={usage.staff} cap={current.maxStaff} />
        <UsageBar label="Estates"     used={usage.estates} cap={current.maxEstates} />
        <UsageBar label="Tickets this month" used={usage.ticketsThisMonth} cap={current.maxTicketsPerMonth} />
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const isCurrent = id === current.id;
          return (
            <div
              key={id}
              className={
                "rounded-2xl border p-5 flex flex-col " +
                (isCurrent
                  ? "border-red-500 bg-red-50/30 shadow-md"
                  : "border-slate-200 bg-white")
              }
            >
              <div className="mb-2">
                <div className="text-xs uppercase tracking-wider text-slate-500">{p.name}</div>
                <div className="text-3xl font-semibold text-slate-900 mt-1">
                  {p.priceMonthlySGD === null
                    ? "Custom"
                    : p.priceMonthlySGD === 0
                    ? "Free"
                    : <>S${p.priceMonthlySGD}<span className="text-sm text-slate-500">/mo</span></>}
                </div>
                {p.priceAnnualSGD && p.priceAnnualSGD > 0 && (
                  <div className="text-xs text-slate-500 mt-0.5">or S${p.priceAnnualSGD}/yr</div>
                )}
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700 mt-3 flex-1">
                <Row ok label={`${p.maxStaff === -1 ? "Unlimited" : p.maxStaff} staff`} />
                <Row ok label={`${p.maxEstates === -1 ? "Unlimited" : p.maxEstates} estate${p.maxEstates === 1 ? "" : "s"}`} />
                <Row ok label={p.maxTicketsPerMonth === -1 ? "Unlimited tickets" : `${p.maxTicketsPerMonth} tickets/month`} />
                <Row on={p.features.pdfDocuments}   label="Invoices, quotations, service reports" />
                <Row on={p.features.customBranding} label="Custom branding on PDFs" />
                <Row on={p.features.auditLog}       label="Audit log" />
                <Row on={p.features.dataExport}     label="Data export" />
                <Row on={p.features.prioritySupport}label="Priority support" />
                <Row on={p.features.sso}            label="SSO" />
              </ul>
              {isCurrent ? (
                <div className="mt-4 text-center text-sm font-medium text-red-700 py-2 rounded-full bg-red-100">
                  Your current plan
                </div>
              ) : (
                <div className="mt-4">
                  <div className="text-center text-xs text-slate-500 py-2">
                    Contact <a href="mailto:sales@feppsxfms.com" className="text-red-600 hover:underline">sales@feppsxfms.com</a> to change plans.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-xs text-slate-500 text-center">
        Plan changes are handled manually by FeppsXFMS support during our pilot period.
        Stripe self-serve billing is coming soon.
      </div>
    </AppShell>
  );
}

function UsageBar({ label, used, cap }: { label: string; used: number; cap: number }) {
  const unlimited = cap === -1;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, cap)) * 100));
  const tone = unlimited ? "bg-emerald-500" : pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
        <Zap className="w-4 h-4 text-slate-400" />
      </div>
      <div className="text-xl font-semibold text-slate-900 mb-2">
        {used} <span className="text-sm text-slate-500 font-normal">/ {unlimited ? "∞" : cap}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${unlimited ? 100 : pct}%` }} />
      </div>
    </div>
  );
}

function Row({ on, ok, label }: { on?: boolean; ok?: boolean; label: string }) {
  const good = on || ok;
  return (
    <li className="flex items-start gap-2">
      {good ? <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> : <X className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}
      <span className={good ? "" : "text-slate-400"}>{label}</span>
    </li>
  );
}

// Silence unused import warning (PlanId is referenced only for future use)
export type _PlanId = PlanId;
