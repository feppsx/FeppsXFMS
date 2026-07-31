# Current step: Deploy Phase 2 (session + query scoping)

Phase 2 wires the app to use `organization_id` end-to-end. The code changes are done; you just need to (1) run one SQL patch in Supabase, (2) push to GitHub so Vercel picks it up.

---

## Step 1 — Run `v3_patch_2.sql` in Supabase

Adds a BEFORE-INSERT trigger to every tenant table that auto-fills `organization_id` from the caller's profile. This saves us hand-editing every insert in every server action.

1. Supabase -> **SQL Editor -> + New query**.
2. On your computer: `C:\Users\Shanjithraj\Desktop\FeppsXFMS\supabase\v3_patch_2.sql` -> right-click -> **Open with Notepad**.
3. **Ctrl + A**, **Ctrl + C** -> paste into Supabase -> **Run**.
4. Expect **Success. No rows returned.**

---

## Step 2 — Test locally (optional but recommended)

If you recreated `.env.local`:

```bash
npm run dev
```

Open http://localhost:3000 and log in as `shanjith160702@gmail.com`. You should land on `/admin` exactly like before. Nothing visible has changed — the multi-tenant boundary is now enforced under the hood.

Also try logging in as `feppsx@gmail.com` (platform admin). You should get redirected to `/platform` — which will 404 for now, because we haven't built the platform panel yet (that's Phase 3).

---

## Step 3 — Push to GitHub

Open a terminal in the project folder:

```bash
git status                                              # see what will be committed
git add .
git commit -m "Phase 2: session + query scoping (org_id + platform_admin routing)"
git push
```

Vercel will auto-detect the push and start a new deploy.

---

## Step 4 — Wait for Vercel + smoke test

1. Watch the deploy in your Vercel dashboard. Should succeed in 2-4 min.
2. Once deployed, open your Vercel URL and log in as `shanjith160702@gmail.com`. Same experience as `/admin` locally.
3. Try creating a new ticket. It should save successfully (the trigger auto-fills `organization_id`).

---

## What changed in Phase 2 (for reference)

- `lib/db-types.ts` — added `Organization`, `PlatformAdmin`, `Invitation` types. Added `organization_id` to every row interface. Renamed `admin` role -> `org_admin`.
- `lib/guard.ts` — new `requirePlatformAdmin()` and `currentOrgId()` helpers. `requireProfile()` now auto-detects platform admins and redirects them to `/platform`.
- `lib/utils.ts` — `homeForRole()` handles new role name.
- `app/page.tsx` — platform admins auto-redirect to `/platform`.
- ~30 files under `app/` and `components/` — role literal `admin` -> `org_admin` (mechanical rename).
- `lib/actions/invoices.ts` + `components/ManualInvoiceForm.tsx` — return + display `organization_id` for the invoice confirmation view.
- **`supabase/v3_patch_2.sql`** — DB-side auto-fill of `organization_id` on every tenant insert.

---

## When Step 4 is green

Tell me. Phase 3 next — the platform admin panel at `/platform/*` (org list, create org, suspend/impersonate).
