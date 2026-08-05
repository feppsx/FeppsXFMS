# Current step: Deploy Phase 8a (plan tiers + hard limits)

Pricing model wired in. Four tiers:

| Plan       | Price      | Staff | Estates   | Tickets/mo | PDFs | Branding | Audit | Export | Priority | SSO |
|------------|------------|-------|-----------|------------|------|----------|-------|--------|----------|-----|
| Free       | S$0        | 4     | 1         | 50         | ❌   | ❌       | ❌    | ❌     | ❌       | ❌  |
| Pro        | S$79/mo    | 10    | 10        | ∞          | ✅   | ✅       | ❌    | ❌     | ❌       | ❌  |
| Business   | S$249/mo   | 30    | ∞         | ∞          | ✅   | ✅       | ✅    | ✅     | ✅       | ❌  |
| Enterprise | Custom     | ∞     | ∞         | ∞          | ✅   | ✅       | ✅    | ✅     | ✅       | ✅  |

Enforced at insert time — inviting a 5th staffer on Free tier returns an error, adding a 2nd estate on Free returns an error, creating the 51st ticket in a month on Free returns an error, creating any invoice/quotation/service report on Free returns an error.

**No new SQL patch this time** — `organizations.plan` already existed from v3.sql. Only code.

---

## Step 1 — Push

```bash
git add .
git commit -m "Phase 8a: plan tiers + hard limits enforcement"
git push
```

Wait 2-4 min for Vercel.

---

## Step 2 — Test

**Org admin's billing page (`/admin/billing`)**
1. Log in as any org admin. Sidebar → **Billing & plan**.
2. Top row: 3 usage bars — staff / estates / tickets this month, each with cap.
3. Below: side-by-side comparison of Free / Pro / Business / Enterprise, current plan highlighted.

**Enforce limits (test on Free tier)**
1. As `feppsx@gmail.com` → org detail for any org → **Plan** dropdown → set to **Free**.
2. Log in as that org's admin. Try to:
   - Invite a 5th staff member (org admin/manager/technician) → should error "Your Free plan allows up to 4 staff."
   - Add a 2nd estate → "up to 1 estate"
   - Generate any invoice/quotation/service report → "PDF documents isn't included in your Free plan"
   - Have a requester raise 51 tickets in a month → cap triggers on the 51st

**Change plan on the fly**
1. `feppsx@gmail.com` → org detail → Plan dropdown → change to Pro. Refresh the tenant's browser — limits lift immediately.
2. Every plan change lands in `/platform/audit` with `change_org_plan` action.

---

## What Phase 8a built

- **`lib/plans.ts`** — source of truth. PLANS object, feature flags, `checkAddStaff` / `checkAddEstate` / `checkTicketMonthlyCap` / `checkFeature` helpers.
- Enforcement wired into:
  - `lib/actions/invitations.ts` (staff cap)
  - `lib/actions/clients.ts` (estate cap)
  - `lib/actions/tickets.ts` (monthly ticket cap)
  - `lib/actions/invoices.ts`, `quotations.ts`, `service-reports.ts` (PDF feature gate)
- **`lib/actions/platform-admin.ts`** — new `changeOrgPlan(orgId, plan)` action; audit-logged.
- **`components/OrgPlanSelect.tsx`** — dropdown on the platform org detail page.
- **`app/admin/billing/page.tsx`** — usage bars + plan comparison for org admins.
- **`components/Sidebar.tsx`** — new **Billing & plan** entry for org admins.

---

## Roadmap

- **Phase 8a — done today.** Plans + limits + platform manual plan changes.
- **Phase 8b — trial management.** New orgs get 14-day Pro trial; auto-downgrade to Free after; trial banner.
- **Phase 8c — Stripe billing.** Self-serve upgrade/downgrade, Stripe checkout, webhooks. Only worth doing once real customers are asking to pay.

Tell me when Step 2 is verified and pick either 8b (trial), 8c (Stripe), or a different feature entirely.
