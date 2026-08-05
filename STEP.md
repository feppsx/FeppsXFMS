# Current step: Fix — Branding page loses the logo after refresh

Root cause: `lib/actions/company-settings.ts` still assumed single-tenant. It:
1. Tried to write to a `singleton_lock` column we dropped in v3.sql (insert failed silently on new orgs).
2. Used `.limit(1)` to find "the" existing row, so updates could land on the wrong org's row.

Fixed — the action now filters and inserts by the caller's `organization_id` explicitly.

**No SQL changes.** Code only.

---

## Step 1 — Push to GitHub

```bash
git add .
git commit -m "Fix: company_settings update/insert scoped to caller's org"
git push
```

Vercel auto-deploys in 2-4 min.

---

## Step 2 — Verify

1. Log in as **Wipro** org_admin.
2. Sidebar → **Branding** → upload a logo → **Save**.
3. Refresh the page. The logo should still be there (previously it vanished).
4. Refresh the whole app (F5). Sidebar top-left should now show the Wipro logo (not the text "Wipro").
5. Repeat for Acme and 360 Integrated. Each org shows their own logo, walled off from the others.

---

## When Step 2 works

Tell me and we continue with Phase 6 (suspended-org login gate + polish).
