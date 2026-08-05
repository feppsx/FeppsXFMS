# Current step: Deploy consent-based impersonation + audit log

Two-part upgrade:

**A. Per-org consent toggle for impersonation.** Off by default (one-click). When on, any impersonation attempt shows the target user a modal in their own app; they Approve or Deny. Realtime — pops up instantly if they're online, or on next page load if not.

**B. Platform audit log.** Every platform_admin action (create org, suspend, delete, impersonate, invite, reset password, toggle consent) writes a row. New `/platform/audit` page lists the last 200 events.

Every impersonation attempt now also forces the platform admin to type a short reason first — logged, and shown to the user in the consent modal if that org requires consent.

---

## Step 1 — Run `v3_patch_5.sql`

Adds `organizations.require_impersonation_consent`, the `impersonation_requests` table, and the `platform_audit_log` table. Enables realtime on `impersonation_requests` so the consent modal pops up instantly.

1. Supabase → **SQL Editor → + New query**.
2. `C:\Users\Shanjithraj\Desktop\FeppsXFMS\supabase\v3_patch_5.sql` → open in Notepad → Ctrl+A, Ctrl+C.
3. Paste → **Run**.
4. Expect **Success. No rows returned.**

---

## Step 2 — Push

```bash
git add .
git commit -m "Consent-based impersonation + platform audit log"
git push
```

Wait 2-4 min for Vercel.

---

## Step 3 — Verify

**Test A: default (no consent required).**
1. Log in as `feppsx@gmail.com`. Open the **Wipro** org detail page.
2. Confirm the toggle **"Require user approval for support impersonation"** is OFF.
3. Click **Impersonate** on a team member → type a reason (e.g. `Testing impersonation flow`) → **Continue**.
4. You should immediately land inside that user's app (no waiting).
5. Sign out, sign back in as `feppsx@gmail.com`.

**Test B: consent required.**
1. Same org detail page → flip the toggle **ON**.
2. Open a second browser (incognito) → log in as the Wipro org_admin. Leave that tab open.
3. Back in the platform admin window → click **Impersonate** on that same user → reason → **Continue**.
4. In the incognito tab, a modal should pop up **within a couple seconds** ("FeppsXFMS support wants to access your workspace" + your reason). Click **Approve**.
5. The platform-admin window's "Waiting for..." spinner should auto-proceed and land inside the user's app.
6. Try the same but click **Deny** — platform admin gets a "user denied the request" error.

**Test C: audit log.**
1. Sidebar → **Audit log**. You should see rows for every action you took above:
   - Requested impersonation (Wipro / "Testing impersonation flow")
   - Impersonated user (Wipro / ... / consent = granted or not_required)
   - Enabled consent-required (Wipro)
   - etc.

---

## What was built

- **`supabase/v3_patch_5.sql`** — new column + 2 tables + RLS + realtime.
- **`lib/actions/platform-admin.ts`** — `startImpersonation` (with reason + consent branching), `pollImpersonation`, `cancelImpersonation`, `setOrgConsentRequired`; internal `logAudit()` used by every mutating action.
- **`lib/actions/impersonation-consent.ts`** — `respondToImpersonation(approve)` for the tenant user.
- **`lib/actions/organizations.ts`** — added audit logging on create / suspend / reactivate / delete.
- **`components/ImpersonationConsent.tsx`** — modal that lives inside every tenant page (via AppShell) and pops up when a request lands. Subscribes to Supabase Realtime so it's near-instant.
- **`components/AppShell.tsx`** — mounts `ImpersonationConsent`.
- **`components/PlatformTeamActions.tsx`** — reason prompt, then either immediate finish or "Waiting for user…" spinner with cancel.
- **`components/OrgConsentToggle.tsx`** — the on/off switch on the org detail page.
- **`components/PlatformShell.tsx`** — new **Audit log** nav entry.
- **`app/platform/audit/page.tsx`** — audit log viewer.
- **`lib/db-types.ts`** — Organization type gained `require_impersonation_consent`.

---

When Steps 1-3 are green, tell me. Any of the other deferred features next (activity graphs, inactive-orgs view, announcements banner, real email invites, Stripe billing, data export) — or stop here.
