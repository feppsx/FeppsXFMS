# Current step: Fix logo upload + wrong org name in sidebar

Two bugs found:
1. **Can't upload logo on Branding page** — `v3.sql` did `drop function is_360_admin cascade`, which also dropped the storage policies on `company-assets` that referenced it. So no one has write access to the bucket right now.
2. **Wrong org name in sidebar** — `getCompanyBranding` was fetching company_settings with `.limit(1)` and trusting RLS to filter, which was fragile. Now filters explicitly by the caller's org_id.

---

## Step 1 — Run `v3_patch_4.sql` in Supabase

Restores the storage policies on `company-assets` using the new org-aware helpers.

1. Supabase -> **SQL Editor -> + New query**.
2. On your computer: `C:\Users\Shanjithraj\Desktop\FeppsXFMS\supabase\v3_patch_4.sql` -> right-click -> **Open with Notepad**.
3. **Ctrl + A**, **Ctrl + C** -> paste -> **Run**.
4. Expect **Success. No rows returned.**

---

## Step 2 — Push code changes

```bash
git add .
git commit -m "Fix: logo upload storage policies + explicit org filter in getCompanyBranding"
git push
```

Vercel auto-deploys in 2-4 min.

---

## Step 3 — Verify

1. Log in as `shanjith160702@gmail.com` (360 Integrated).
   - Go to **Branding** -> upload a logo -> Save. Should succeed now.
   - Refresh -> sidebar shows the uploaded 360 logo image.
2. Log in as your **Wipro** org_admin (in incognito).
   - Sidebar top-left should now say **"Wipro"** (the org name), not "360 Integrated".
   - Go to Branding -> upload a Wipro logo -> Save. Refresh -> sidebar shows Wipro logo.
3. Log in as your **Acme** org_admin (incognito).
   - Sidebar shows "Acme" text (until you upload their logo).

---

## What was broken (root cause)

When v3.sql renamed helpers from `is_360_admin` to `is_org_admin`, the `drop function ... cascade` swept along any object that referenced the old function — including the storage bucket policies added by patch #24. Those policies weren't visible in the schema files, so the migration silently removed them. v3_patch_4 restores them with the new helpers and adds platform_admin bypass.

The sidebar issue was a separate case where the `.limit(1).maybeSingle()` pattern could return the wrong org's row if RLS was ever bypassed or misconfigured. Explicit `.eq("organization_id", orgId)` closes that off.

---

When step 3 is fully green, tell me. We can then move to Phase 6 (suspended-org login gate + polish).
