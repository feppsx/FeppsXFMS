// Source of truth for FeppsXFMS pricing tiers. Everything about a plan
// (limits, features, price) is defined here so no other file has to hardcode
// plan strings.
//
// To add a plan: append to PLAN_ORDER, add an entry to PLANS, done.

import { createAdminClient } from "@/lib/supabase/admin";

export type PlanId = "free" | "pro" | "business" | "enterprise";

export const PLAN_ORDER: PlanId[] = ["free", "pro", "business", "enterprise"];

export interface PlanDef {
  id:                 PlanId;
  name:               string;
  priceMonthlySGD:    number | null;      // null = custom / talk to sales
  priceAnnualSGD:     number | null;
  maxStaff:           number;             // -1 = unlimited
  maxEstates:         number;
  maxTicketsPerMonth: number;
  features: {
    pdfDocuments:     boolean;   // invoices, quotations, service reports
    customBranding:   boolean;   // logo + name on PDFs
    auditLog:         boolean;   // org can view their audit log
    dataExport:       boolean;
    prioritySupport:  boolean;
    sso:              boolean;
    whiteLabel:       boolean;   // remove "Powered by FeppsXFMS" from public forms
  };
}

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthlySGD: 0,
    priceAnnualSGD:  0,
    maxStaff: 4,
    maxEstates: 1,
    maxTicketsPerMonth: 50,
    features: {
      pdfDocuments:    false,
      customBranding:  false,
      auditLog:        false,
      dataExport:      false,
      prioritySupport: false,
      sso:             false,
      whiteLabel:      false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthlySGD: 79,
    priceAnnualSGD:  799,
    maxStaff: 10,
    maxEstates: 10,
    maxTicketsPerMonth: -1,
    features: {
      pdfDocuments:    true,
      customBranding:  true,
      auditLog:        false,
      dataExport:      false,
      prioritySupport: false,
      sso:             false,
      whiteLabel:      false,
    },
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthlySGD: 249,
    priceAnnualSGD:  2490,
    maxStaff: 30,
    maxEstates: -1,
    maxTicketsPerMonth: -1,
    features: {
      pdfDocuments:    true,
      customBranding:  true,
      auditLog:        true,
      dataExport:      true,
      prioritySupport: true,
      sso:             false,
      whiteLabel:      false,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthlySGD: null,
    priceAnnualSGD:  null,
    maxStaff: -1,
    maxEstates: -1,
    maxTicketsPerMonth: -1,
    features: {
      pdfDocuments:    true,
      customBranding:  true,
      auditLog:        true,
      dataExport:      true,
      prioritySupport: true,
      sso:             true,
      whiteLabel:      true,
    },
  },
};

// A row is "staff" if the role costs a seat. Requesters are always free.
export const STAFF_ROLES = ["org_admin", "manager", "technician"] as const;

export function planFor(planId: string | null | undefined): PlanDef {
  const p = (planId ?? "free") as PlanId;
  return PLANS[p] ?? PLANS.free;
}

// -----------------------------------------------------------------------
// Enforcement helpers — called from server actions before doing the work.
// Return { ok: true } if allowed, or { ok: false, error } to abort.
// -----------------------------------------------------------------------

export interface LimitCheck { ok: boolean; error?: string; upgradeTo?: PlanId }

export async function checkAddStaff(orgId: string): Promise<LimitCheck> {
  const admin = createAdminClient();
  const org = await getOrgPlan(orgId);
  if (!org) return { ok: false, error: "Organization not found." };
  const plan = planFor(org.plan);
  if (plan.maxStaff === -1) return { ok: true };

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .in("role", STAFF_ROLES as unknown as string[]);
  if ((count ?? 0) >= plan.maxStaff) {
    return {
      ok: false,
      error: `Your ${plan.name} plan allows up to ${plan.maxStaff} staff. Upgrade to add more.`,
      upgradeTo: nextTier(plan.id),
    };
  }
  return { ok: true };
}

export async function checkAddEstate(orgId: string): Promise<LimitCheck> {
  const admin = createAdminClient();
  const org = await getOrgPlan(orgId);
  if (!org) return { ok: false, error: "Organization not found." };
  const plan = planFor(org.plan);
  if (plan.maxEstates === -1) return { ok: true };

  const { count } = await admin
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);
  if ((count ?? 0) >= plan.maxEstates) {
    return {
      ok: false,
      error: `Your ${plan.name} plan allows up to ${plan.maxEstates} estate${plan.maxEstates === 1 ? "" : "s"}. Upgrade to add more.`,
      upgradeTo: nextTier(plan.id),
    };
  }
  return { ok: true };
}

export async function checkTicketMonthlyCap(orgId: string): Promise<LimitCheck> {
  const admin = createAdminClient();
  const org = await getOrgPlan(orgId);
  if (!org) return { ok: false, error: "Organization not found." };
  const plan = planFor(org.plan);
  if (plan.maxTicketsPerMonth === -1) return { ok: true };

  const monthStart = new Date();
  monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("created_at", monthStart.toISOString());
  if ((count ?? 0) >= plan.maxTicketsPerMonth) {
    return {
      ok: false,
      error: `You've hit your ${plan.name} plan cap of ${plan.maxTicketsPerMonth} tickets this month. Upgrade to keep raising tickets.`,
      upgradeTo: nextTier(plan.id),
    };
  }
  return { ok: true };
}

export async function checkFeature(
  orgId: string,
  feature: keyof PlanDef["features"]
): Promise<LimitCheck> {
  const org = await getOrgPlan(orgId);
  if (!org) return { ok: false, error: "Organization not found." };
  const plan = planFor(org.plan);
  if (plan.features[feature]) return { ok: true };
  return {
    ok: false,
    error: `The ${humanFeature(feature)} feature isn't included in your ${plan.name} plan.`,
    upgradeTo: nextTier(plan.id),
  };
}

// -----------------------------------------------------------------------
// Internals
// -----------------------------------------------------------------------

async function getOrgPlan(orgId: string): Promise<{ plan: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .maybeSingle<{ plan: string }>();
  return data;
}

function nextTier(current: PlanId): PlanId | undefined {
  const idx = PLAN_ORDER.indexOf(current);
  return idx >= 0 && idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1] : undefined;
}

const FEATURE_LABELS: Record<keyof PlanDef["features"], string> = {
  pdfDocuments:    "PDF documents (invoices/quotations/service reports)",
  customBranding:  "custom branding",
  auditLog:        "audit log",
  dataExport:      "data export",
  prioritySupport: "priority support",
  sso:             "SSO",
  whiteLabel:      "white-label",
};

function humanFeature(f: keyof PlanDef["features"]): string {
  return FEATURE_LABELS[f];
}
