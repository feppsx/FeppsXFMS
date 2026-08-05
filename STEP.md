# Current step: Deploy the per-org sidebar logo fix

The sidebar in `/admin`, `/technician`, `/client` was showing 360 Integrated's static `/logo.png` for every org. Fixed — each org now shows its own uploaded logo (or its org name as text if no logo has been uploaded yet).

**No SQL changes.** Code only.

---

## Step 1 — Push to GitHub

```bash
git add .
git commit -m "Per-org sidebar logo (fallback to org name)"
git push
```

Vercel auto-deploys in 2-4 min.

---

## Step 2 — Verify

1. Log in as the **Acme** test org admin.
   - Sidebar top-left should now say **"Acme"** (text), not the 360 logo.
2. Go to `/admin/branding` -> upload a logo file -> save.
3. Refresh — the sidebar should now show your uploaded Acme logo.
4. Log in as `shanjith160702@gmail.com` (360 Integrated).
   - Sidebar shows their existing uploaded logo (unchanged).

---

## What changed

- **`lib/company-settings-data.ts`** — fallback branding stopped hard-coding 360's data. Fallback now pulls the caller's org name from `organizations` and leaves phone/email/UEN blank.
- **`components/AppShell.tsx`** — now an `async` server component that fetches branding and passes `logoUrl` + `logoDarkUrl` + `companyName` to `Sidebar`.
- **`components/Sidebar.tsx`** — accepts `logoUrl`, `logoDarkUrl`, `companyName` props. Renders the org's own logo if uploaded, otherwise renders the org name as plain text. No more `/logo.png` static reference.

---

When Step 2 looks right, tell me and we continue to Phase 6 (suspended-org login gate + polish).
