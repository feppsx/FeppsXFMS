# Current step: Deploy Phase 3 (platform admin panel)

The `/platform/*` routes are built. Platform admins can now log in and manage customer organizations from a web UI.

No SQL changes this time — only code.

---

## Step 1 — Push to GitHub

Open a terminal in the project folder:

```bash
git status                  # see the new files
git add .
git commit -m "Phase 3: platform admin panel (/platform routes)"
git push
```

Vercel auto-deploys. Wait 2-4 min.

---

## Step 2 — Try it live

1. Open your Vercel URL and log in as **`feppsx@gmail.com`** (the platform admin).
2. You should land on **`/platform`** — the dashboard with counters (total orgs, active, suspended, users, tickets).
3. Click **Organizations** in the sidebar. You'll see `360 Integrated` listed (the seed org from v3.sql).
4. Click **New organization**. Fill in:
   - Organization name: `Acme Facilities` (test)
   - Slug: leave blank (auto-generates `acme-facilities`)
   - Plan: Pro
   - First admin full name: `Test Admin`
   - First admin email: `testadmin@acme.com`
   - Click **Create organization**.
5. The page shows a green box with the temp password. **Copy it now** — it's shown only once.
6. Open an incognito/private browser window and log in as `testadmin@acme.com` with the temp password. You should land on `/admin` — a completely fresh, empty tenant workspace, walled off from 360 Integrated.
7. Go back to the platform admin window. Open the Acme org detail page. Try the **Suspend** button. Then reactivate. Then delete (only test orgs — do NOT delete 360 Integrated; the button is disabled for it anyway).

---

## What Phase 3 built

- `/platform` — dashboard with cross-org counters.
- `/platform/organizations` — list of every org with status pills.
- `/platform/organizations/new` — create-org form that also creates the first `org_admin` user in one shot and reveals the temp password once.
- `/platform/organizations/[id]` — org detail with team roster, ticket/invoice/estate counts, and Suspend / Reactivate / Delete buttons.
- Layout guard: `requirePlatformAdmin()` on the `/platform` layout rejects anyone who isn't in `platform_admins`.

Under the hood, `lib/actions/organizations.ts` uses the service_role admin client to create auth users and bypass RLS. The auto-fill trigger from v3_patch_2 sets `organization_id` on the new admin's profile.

---

## When Step 2 is green

Tell me. Phase 4 next — proper invite emails so you don't have to copy-paste passwords (`invitations` table + `/invite/[token]` page + Resend/Supabase email delivery).
