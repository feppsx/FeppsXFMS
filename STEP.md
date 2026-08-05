# Current step: Deploy Phase 5 (rebrand + per-org settings)

Rebranded the platform chrome from "360 Integrated" to **FeppsXFMS**, gated the public `/signup` route (invite-only), and cleaned up PDF/UI strings that leaked 360-specific text to other customers. New customer orgs now start with their own name pre-filled in company settings.

---

## Step 1 — Run `v3_patch_3.sql` in Supabase

Removes the hardcoded "360 INTEGRATED FM & SM PTE. LTD." default from `company_settings.company_name` and resets the 360 Integrated org's row to just "360 Integrated".

1. Supabase -> **SQL Editor -> + New query**.
2. On your computer: `C:\Users\Shanjithraj\Desktop\FeppsXFMS\supabase\v3_patch_3.sql` -> right-click -> **Open with Notepad**.
3. **Ctrl + A**, **Ctrl + C** -> paste -> **Run**.
4. Expect **Success. No rows returned.**

---

## Step 2 — Push to GitHub

```bash
git status
git add .
git commit -m "Phase 5: rebrand to FeppsXFMS, per-org branding, invite-only"
git push
```

Vercel auto-deploys in 2-4 min.

---

## Step 3 — Verify

1. Open your Vercel URL (log out first if needed). Login page now says **FeppsXFMS**, the browser tab title is "FeppsXFMS — Facility Management", and the tenant-facing copy no longer mentions 360.
2. Navigate to `<vercel-url>/signup` — you should get bounced to `/login` with the message "FeppsXFMS is invite-only. Ask your admin for an invitation."
3. Log in as `feppsx@gmail.com` (platform admin) -> **New organization** -> create a test org named "Acme". Log in as the new Acme admin in incognito, go to **Invoices -> Generate**, generate any invoice, download the PDF — company name at the top should be **"Acme"** (not 360).
4. Log in as `shanjith160702@gmail.com` -> Branding page -> verify company name says "360 Integrated" (the seed org keeps its own brand).

---

## What Phase 5 changed

- **`app/layout.tsx`** — page title + app name = FeppsXFMS.
- **`app/signup/page.tsx`** — now a hard redirect to `/login?invite_only=1`.
- **`app/login/page.tsx`** — shows the "invite-only" message when arriving from `/signup`; logo alt = FeppsXFMS.
- **`components/AuthHero.tsx`, `Sidebar.tsx`, `PublicShell.tsx`, `app/splash/page.tsx`** — alt tags + wordmark = FeppsXFMS.
- **`components/InvoicePDF.tsx`, `QuotationPDF.tsx`, `ServiceReportPDF.tsx`** — hardcoded 360 fallback strings replaced with generic / empty (so a customer who hasn't set Branding sees "Your Company Name" instead of another tenant's brand).
- **Tenant-facing copy** — `NewTicketForm`, `FeedbackForm`, `AnonFeedbackForm`, `PublicReportForm`, `QrDisplay`, `/client/tickets`, `/track/[token]` — 360-branded phrases replaced with generic wording ("your admin", "the team", etc.).
- **`lib/actions/organizations.ts`** — when creating a new org, seed a `company_settings` row using the org's own name.
- **`supabase/v3_patch_3.sql`** — drop old DB default on `company_name`; reset the seed 360 Integrated row.

---

## When Step 3 is green

Tell me. Phase 6 next — suspended-org login gate + usage stats per org + optional audit log.
